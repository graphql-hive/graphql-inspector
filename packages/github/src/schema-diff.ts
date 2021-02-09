import * as probot from 'probot';
import { produceSchema } from './helpers/schema';
import {CheckConclusion, PullRequest} from './helpers/types';
import {FileLoader, ConfigLoader, loadSources} from './helpers/loaders';
import {start, complete, annotate} from './helpers/check-runs';
import {
  SchemaPointer,
  createConfig,
  defaultFallbackBranch,
} from './helpers/config';
import {diff} from './helpers/diff';
import {createSummary} from './helpers/utils';
import {createLogger} from './helpers/logger';
import {MissingConfigError} from './helpers/errors';

export async function handleSchemaDiff({
  action,
  context,
  ref,
  pullRequestNumber,
  repo,
  owner,
  before,
  pullRequests = [],
  loadFile,
  loadConfig,
}: {
  action: string;
  context: probot.Context;
  owner: string;
  repo: string;
  ref: string;
  pullRequestNumber?: number;
  pullRequests: PullRequest[];
  /***
   * The SHA of the most recent commit on ref before the push
   */
  before?: string;
  loadFile: FileLoader;
  loadConfig: ConfigLoader;
}): Promise<void> {
  const id = `${owner}/${repo}#${ref}`;
  const logger = createLogger('DIFF', context);

  logger.info(`Started - ${id}`);
  logger.info(`Action: "${action}"`);

  const checkUrl = await start({
    context,
    owner,
    repo,
    sha: ref,
    logger,
  });

  try {
    logger.info(`Looking for config`);

    const rawConfig = await loadConfig();

    if (!rawConfig) {
      logger.error(`Config file missing`);
      throw new MissingConfigError();
    }

    const branches = pullRequests.map((pr) => pr.base.ref);
    const firstBranch = branches[0];
    const fallbackBranch = firstBranch || before;
    let isLegacyConfig = false;

    logger.info(`fallback branch from Pull Requests: ${firstBranch}`);
    logger.info(`SHA before push: ${before}`);

    // on non-environment related PRs, use a branch from first associated pull request
    const config = createConfig(
      rawConfig as any,
      (configKind) => {
        isLegacyConfig = configKind === 'legacy'
      },
      branches,
      fallbackBranch, // we will probably throw an error when both are not defined
    );

    if (!config.diff) {
      logger.info(`disabled. Skipping...`);

      await complete({
        url: checkUrl,
        context,
        conclusion: CheckConclusion.Success,
        logger,
      });
      return;
    } else {
      logger.info(`enabled`);
    }

    if (!config.branch || /^[0]+$/.test(config.branch)) {
      logger.info(`Nothing to compare with. Skipping...`);
      await complete({
        url: checkUrl,
        context,
        conclusion: CheckConclusion.Success,
        logger,
      });
      return;
    }

    if (config.diff.experimental_merge) {
      if (!pullRequestNumber && pullRequests?.length) {
        pullRequestNumber = pullRequests[0].number;
      }

      if (pullRequestNumber) {
        ref = `refs/pull/${pullRequestNumber}/merge`;
        logger.info(`[EXPERIMENTAL] Using Pull Request: ${ref}`);
      }
    }

    const oldPointer: SchemaPointer = {
      path: config.schema,
      ref: config.branch,
    };
    const newPointer: SchemaPointer = {
      path: oldPointer.path,
      ref,
    };

    if (oldPointer.ref === defaultFallbackBranch) {
      logger.error('used default ref to get old schema');
    }

    if (newPointer.ref === defaultFallbackBranch) {
      logger.error('used default ref to get new schema');
    }

    const sources = await loadSources({
      config,
      oldPointer,
      newPointer,
      loadFile,
    });

    const schemas = {
      old: produceSchema(sources.old),
      new: produceSchema(sources.new),
    };

    logger.info(`built schemas`);

    const action = await diff({
      path: config.schema,
      schemas,
      sources,
    });

    logger.info(`schema diff result is ready`);

    let conclusion = action.conclusion;
    let annotations = action.annotations || [];
    const changes = action.changes || [];

    logger.info(`changes - ${changes.length}`);
    logger.info(`annotations - ${changes.length}`);

    const summaryLimit = config.diff.summaryLimit || 100;

    const summary = createSummary(changes, summaryLimit, isLegacyConfig);

    const approveLabelName =
      config.diff.approveLabel || 'approved-breaking-change';
    const hasApprovedBreakingChangeLabel = pullRequestNumber
      ? pullRequests[0].labels?.find((label) => label.name === approveLabelName)
      : false;

    // Force Success when failOnBreaking is disabled
    if (
      config.diff.failOnBreaking === false ||
      hasApprovedBreakingChangeLabel
    ) {
      logger.info('FailOnBreaking disabled. Forcing SUCCESS');
      conclusion = CheckConclusion.Success;
    }

    const title =
      conclusion === CheckConclusion.Failure
        ? 'Something is wrong with your schema'
        : 'Everything looks good';

    if (config.diff.annotations === false) {
      logger.info(`Anotations are disabled. Skipping annotations...`);
      annotations = [];
    } else if (annotations.length > summaryLimit) {
      logger.info(`Total amount of annotations is over the limit (${annotations.length} > ${summaryLimit}). Skipping annotations...`);
      annotations = [];
    } else {
      logger.info(`Sending annotations (${annotations.length})`);
    }

    await annotate({
      url: checkUrl,
      context,
      title,
      summary,
      annotations,
      logger,
    });

    logger.info(`Finishing check (${conclusion})`);

    await complete({
      url: checkUrl,
      context,
      conclusion,
      logger,
    });

    logger.info(`done`);
  } catch (error) {
    logger.error(error);

    await annotate({
      url: checkUrl,
      context,
      title: `Failed to complete schema check`,
      summary: `ERROR: ${error.message || error}`,
      annotations: [],
      logger,
    });

    await complete({
      url: checkUrl,
      context,
      conclusion: CheckConclusion.Failure,
      logger,
    });
  }
}