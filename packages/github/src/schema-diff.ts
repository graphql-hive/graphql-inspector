import * as probot from 'probot';
import { annotate, complete, start } from './helpers/check-runs.js';
import { createConfig, defaultFallbackBranch, SchemaPointer } from './helpers/config.js';
import { diff } from './helpers/diff.js';
import { MissingConfigError } from './helpers/errors.js';
import { ConfigLoader, FileLoader, loadSources } from './helpers/loaders.js';
import { createLogger } from './helpers/logger.js';
import { produceSchema } from './helpers/schema.js';
import { CheckConclusion, PullRequest } from './helpers/types.js';
import { createSummary } from './helpers/utils.js';

export async function handleSchemaDiff({
  release,
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
  onError,
}: {
  release: string;
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
  onError(error: Error): void;
}): Promise<void> {
  const id = `${owner}/${repo}#${ref}`;
  const logger = createLogger('DIFF', context, release);

  logger.info(`Started - ${id}`);
  logger.info(`Action: "${action}"`);

  const checkRunId = await start({
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

    const branches = pullRequests.map(pr => pr.base.ref);
    const firstBranch = branches[0];
    const fallbackBranch = firstBranch || before;
    let isLegacyConfig = false;

    logger.info(`fallback branch from Pull Requests: ${firstBranch}`);
    logger.info(`SHA before push: ${before}`);

    // on non-environment related PRs, use a branch from first associated pull request
    const config = createConfig(
      rawConfig as any,
      configKind => {
        isLegacyConfig = configKind === 'legacy';
      },
      branches,
      fallbackBranch, // we will probably throw an error when both are not defined
    );

    if (!config.diff) {
      logger.info(`disabled. Skipping...`);

      await complete({
        owner,
        repo,
        checkRunId,
        context,
        conclusion: CheckConclusion.Success,
        logger,
      });
      return;
    }
    logger.info(`enabled`);

    if (!config.branch || /^[0]+$/.test(config.branch)) {
      logger.info(`Nothing to compare with. Skipping...`);
      await complete({
        owner,
        repo,
        checkRunId,
        context,
        conclusion: CheckConclusion.Success,
        logger,
      });
      return;
    }

    if (config.diff.experimental_merge !== false) {
      if (!pullRequestNumber && pullRequests?.length) {
        pullRequestNumber = pullRequests[0].number;
      }

      if (pullRequestNumber) {
        ref = `refs/pull/${pullRequestNumber}/merge`;
        logger.info(`Using Pull Request: ${ref}`);
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

    const approveLabelName = config.diff.approveLabel || 'approved-breaking-change';
    const hasApprovedBreakingChangeLabel = pullRequestNumber
      ? pullRequests[0].labels?.find(label => label.name === approveLabelName)
      : false;

    // Force Success when failOnBreaking is disabled
    if (config.diff.failOnBreaking === false || hasApprovedBreakingChangeLabel) {
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
      logger.info(
        `Total amount of annotations is over the limit (${annotations.length} > ${summaryLimit}). Skipping annotations...`,
      );
      annotations = [];
    } else {
      logger.info(`Sending annotations (${annotations.length})`);
    }

    await annotate({
      owner,
      repo,
      checkRunId,
      context,
      title,
      summary,
      annotations,
      logger,
    });

    logger.info(`Finishing check (${conclusion})`);

    await complete({
      owner,
      repo,
      checkRunId,
      context,
      conclusion,
      logger,
    });

    logger.info(`done`);
  } catch (error: any) {
    logger.error(error);

    if (!(error instanceof MissingConfigError)) {
      onError(error);
    }

    await annotate({
      owner,
      repo,
      checkRunId,
      context,
      title: `Failed to complete schema check`,
      summary: `ERROR: ${error.message || error}`,
      annotations: [],
      logger,
    });

    await complete({
      owner,
      repo,
      checkRunId,
      context,
      conclusion: CheckConclusion.Failure,
      logger,
    });
  }
}
