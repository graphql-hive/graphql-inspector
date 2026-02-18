import { extname } from 'path';
import { buildClientSchema, buildSchema, GraphQLSchema, printSchema, Source } from 'graphql';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { Rule } from '@graphql-inspector/core';
import { diff } from '../helpers/diff.js';
import { printSchemaFromEndpoint } from '../helpers/loaders.js';
import { produceSchema } from '../helpers/schema.js';
import { CheckConclusion } from '../helpers/types.js';
import { createSummary } from '../helpers/utils.js';
import { updateCheckRun } from './checks.js';
import { fileLoader } from './files.js';
import { getAssociatedPullRequest, getCurrentCommitSha } from './git.js';
import { castToBoolean, getInputAsArray, resolveRule } from './utils.js';

const CHECK_NAME = 'GraphQL Inspector';

export async function run() {
  core.info(`GraphQL Inspector started`);

  // env
  let ref = process.env.GITHUB_SHA!;
  const commitSha = getCurrentCommitSha();

  core.info(`Ref: ${ref}`);
  core.info(`Commit SHA: ${commitSha}`);

  const token = core.getInput('github-token', { required: true });
  const checkName = core.getInput('name') || CHECK_NAME;

  let workspace = process.env.GITHUB_WORKSPACE;

  if (!workspace) {
    return core.setFailed('Failed to resolve workspace directory. GITHUB_WORKSPACE is missing');
  }

  const useMerge = castToBoolean(core.getInput('experimental_merge'), true);
  const useAnnotations = castToBoolean(core.getInput('annotations'));
  const failOnBreaking = castToBoolean(core.getInput('fail-on-breaking'));
  const endpoint: string = core.getInput('endpoint');
  const approveLabel: string = core.getInput('approve-label') || 'approved-breaking-change';
  const rulesList = getInputAsArray('rules') || [];
  const onUsage = core.getInput('onUsage');
  const successMessage: string = core.getInput('success-title') || 'Everything looks good';
  const failureMessage: string = core.getInput('failure-title') || 'Something is wrong with your schema';

  const octokit = github.getOctokit(token);

  // repo
  const { owner, repo } = github.context.repo;

  // pull request
  const pullRequest = await getAssociatedPullRequest(octokit, commitSha);

  core.info(`Creating a check named "${checkName}"`);

  const check = await octokit.rest.checks.create({
    owner,
    repo,
    name: checkName,
    head_sha: commitSha,
    status: 'in_progress',
  });

  const checkId = check.data.id;

  core.info(`Check ID: ${checkId}`);

  const schemaPointer = core.getInput('schema', { required: true });

  const loadFile = fileLoader({
    octokit,
    owner,
    repo,
  });

  if (!schemaPointer) {
    core.error('No `schema` variable');
    return core.setFailed('Failed to find `schema` variable');
  }

  const rules = rulesList
    .map(r => {
      const rule = resolveRule(r);

      if (!rule) {
        core.error(`Rule ${r} is invalid. Did you specify the correct path?`);
      }

      return rule;
    })
    .filter(Boolean) as Rule[];

  // Different lengths mean some rules were resolved to undefined
  if (rules.length !== rulesList.length) {
    return core.setFailed("Some rules weren't recognised");
  }

  let config;

  if (onUsage) {
    const checkUsage = require(onUsage);

    if (checkUsage) {
      config = {
        checkUsage,
      };
    }
  }

  let [schemaRef, schemaPath] = schemaPointer.split(':');

  if (useMerge && pullRequest?.state === 'open') {
    ref = `refs/pull/${pullRequest.number}/merge`;
    workspace = undefined;
    core.info(`EXPERIMENTAL - Using Pull Request ${ref}`);

    const baseRef = pullRequest.base?.ref;

    if (baseRef) {
      schemaRef = baseRef;
      core.info(`EXPERIMENTAL - Using ${baseRef} as base schema ref`);
    }
  }

  if (endpoint) {
    schemaPath = schemaPointer;
  }

  const isNewSchemaUrl = endpoint && schemaPath.startsWith('http');

  const [oldFile, newFile] = await Promise.all([
    endpoint
      ? printSchemaFromEndpoint(endpoint)
      : loadFile({
          ref: schemaRef,
          path: schemaPath,
        }),
    isNewSchemaUrl
      ? printSchemaFromEndpoint(schemaPath)
      : loadFile({
          path: schemaPath,
          ref,
          workspace,
        }),
  ]);

  core.info('Got both sources');

  let oldSchema: GraphQLSchema;
  let newSchema: GraphQLSchema;
  let sources: { new: Source; old: Source };

  if (extname(schemaPath.toLowerCase()) === '.json') {
    oldSchema = endpoint ? buildSchema(oldFile) : buildClientSchema(JSON.parse(oldFile));
    newSchema = buildClientSchema(JSON.parse(newFile));

    sources = {
      old: new Source(printSchema(oldSchema), endpoint || `${schemaRef}:${schemaPath}`),
      new: new Source(printSchema(newSchema), schemaPath),
    };
  } else {
    sources = {
      old: new Source(oldFile, endpoint || `${schemaRef}:${schemaPath}`),
      new: new Source(newFile, schemaPath),
    };

    oldSchema = produceSchema(sources.old);
    newSchema = produceSchema(sources.new);
  }

  const schemas = {
    old: oldSchema,
    new: newSchema,
  };

  core.info(`Built both schemas`);

  core.info(`Start comparing schemas`);

  const action = await diff({
    path: schemaPath,
    schemas,
    sources,
    rules,
    config,
  });

  let conclusion = action.conclusion;
  let annotations = action.annotations || [];
  const changes = action.changes || [];

  core.setOutput('changes', String(changes.length || 0));
  core.info(`Changes: ${changes.length || 0}`);

  const hasApprovedBreakingChangeLabel = pullRequest?.labels?.some(
    (label: any) => label.name === approveLabel,
  );

  // Force Success when failOnBreaking is disabled
  if (
    (failOnBreaking === false || hasApprovedBreakingChangeLabel) &&
    conclusion === CheckConclusion.Failure
  ) {
    core.info('FailOnBreaking disabled. Forcing SUCCESS');
    conclusion = CheckConclusion.Success;
  }

  if (useAnnotations === false || isNewSchemaUrl) {
    core.info(`Anotations are disabled. Skipping annotations...`);
    annotations = [];
  }

  const summary = createSummary(changes, 100, false);

  // const successMessage: string = 'Everything looks good';
  // const failureMessage: string = 'Something is wrong with your schema';
  const title =
    conclusion === CheckConclusion.Failure
    ? failureMessage
    : successMessage;

  core.info(`Conclusion: ${conclusion}`);

  try {
    return await updateCheckRun(octokit, checkId, {
      conclusion,
      output: { title, summary, annotations },
    });
  } catch (e: any) {
    // Error
    core.error(e.message || e);

    const title = 'Invalid config. Failed to add annotation';

    await updateCheckRun(octokit, checkId, {
      conclusion: CheckConclusion.Failure,
      output: { title, summary: title, annotations: [] },
    });

    return core.setFailed(title);
  }
}
