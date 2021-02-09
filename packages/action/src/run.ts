import {
  CheckConclusion,
  diff,
  createSummary,
  printSchemaFromEndpoint,
  produceSchema,
} from '@graphql-inspector/github';
import {Source} from 'graphql';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {execSync} from 'child_process';

import * as core from '@actions/core';
import * as github from '@actions/github';
import {Octokit} from '@octokit/rest';

type OctokitInstance = ReturnType<typeof github.getOctokit>;

const CHECK_NAME = 'GraphQL Inspector';

function getCurrentCommitSha() {
  const sha = execSync(`git rev-parse HEAD`).toString().trim();

  try {
    const msg = execSync(`git show ${sha} -s --format=%s`).toString().trim();
    const PR_MSG = /Merge (\w+) into \w+/i;

    if (PR_MSG.test(msg)) {
      const result = PR_MSG.exec(msg);

      if (result) {
        return result[1];
      }
    }
  } catch (e) {
    //
  }

  return sha;
}

export async function run() {
  core.info(`GraphQL Inspector started`);

  // env
  let ref = process.env.GITHUB_SHA!;
  const commitSha = getCurrentCommitSha();

  core.info(`Ref: ${ref}`);
  core.info(`Commit SHA: ${commitSha}`);

  //
  // env:
  //   GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  //
  const token = core.getInput('github-token') || process.env.GITHUB_TOKEN;
  const checkName = core.getInput('name') || CHECK_NAME;

  if (!token) {
    return core.setFailed('Github Token is missing');
  }

  let workspace = process.env.GITHUB_WORKSPACE;

  if (!workspace) {
    return core.setFailed(
      'Failed to resolve workspace directory. GITHUB_WORKSPACE is missing',
    );
  }

  const useExperimentalMerge = castToBoolean(core.getInput('experimental_merge'), false);
  const useAnnotations = castToBoolean(core.getInput('annotations'));
  const failOnBreaking = castToBoolean(core.getInput('fail-on-breaking'));
  const endpoint = core.getInput('endpoint');

  const octokit = github.getOctokit(token);

  // repo
  const {owner, repo} = github.context.repo;

  core.info(`Creating a check named "${checkName}"`);

  const check = await octokit.checks.create({
    owner,
    repo,
    name: checkName,
    head_sha: commitSha,
    status: 'in_progress',
  });

  const checkId = check.data.id;

  core.info(`Check ID: ${checkId}`);

  const schemaPointer = core.getInput('schema', {required: true});

  const loadFile = fileLoader({
    octokit,
    owner,
    repo,
  });

  if (!schemaPointer) {
    core.error('No `schema` variable');
    return core.setFailed('Failed to find `schema` variable');
  }

  let [schemaRef, schemaPath] = schemaPointer.split(':');

  if (useExperimentalMerge && github.context.payload.pull_request) {
    ref = `refs/pull/${github.context.payload.pull_request.number}/merge`
    workspace = undefined;
    core.info(`EXPERIMENTAL - Using Pull Request ${ref}`)
    
    const baseRef = github.context.payload.pull_request?.base?.ref;
    
    if (baseRef) {
      schemaRef = baseRef
      core.info(`EXPERIMENTAL - Using ${baseRef} as base schema ref`)
    }
  }

  const [oldFile, newFile] = await Promise.all([
    endpoint
      ? printSchemaFromEndpoint(endpoint)
      : loadFile({
          ref: schemaRef,
          path: schemaPath,
        }),
    loadFile({
      path: endpoint ? schemaPointer : schemaPath,
      ref,
      workspace,
    }),
  ]);

  core.info('Got both sources');

  const sources = {
    old: new Source(oldFile, endpoint || `${schemaRef}:${schemaPath}`),
    new: new Source(newFile, endpoint ? schemaPointer : schemaPath),
  };

  const schemas = {
    old: produceSchema(sources.old),
    new: produceSchema(sources.new),
  };

  core.info(`Built both schemas`);

  core.info(`Start comparing schemas`);

  const action = await diff({
    path: schemaPath,
    schemas,
    sources,
  });

  let conclusion = action.conclusion;
  let annotations = action.annotations || [];
  const changes = action.changes || [];

  core.setOutput('changes', `${changes.length || 0}`);
  core.info(`Changes: ${changes.length || 0}`);

  // Force Success when failOnBreaking is disabled
  if (failOnBreaking === false && conclusion === CheckConclusion.Failure) {
    core.info('FailOnBreaking disabled. Forcing SUCCESS');
    conclusion = CheckConclusion.Success;
  }

  if (useAnnotations === false) {
    core.info(`Anotations are disabled. Skipping annotations...`);
    annotations = [];
  }

  const summary = createSummary(changes, 100, false);

  const title =
    conclusion === CheckConclusion.Failure
      ? 'Something is wrong with your schema'
      : 'Everything looks good';

  core.info(`Conclusion: ${conclusion}`);

  try {
    return await updateCheckRun(octokit, checkId, {
      conclusion,
      output: {title, summary, annotations},
    });
  } catch (e) {
    // Error
    core.error(e.message || e);

    const title = 'Invalid config. Failed to add annotation';

    await updateCheckRun(octokit, checkId, {
      conclusion: CheckConclusion.Failure,
      output: {title, summary: title, annotations: []},
    });

    return core.setFailed(title);
  }
}

function fileLoader({
  octokit,
  owner,
  repo,
}: {
  octokit: OctokitInstance;
  owner: string;
  repo: string;
}) {
  const query = /* GraphQL */`
    query GetFile($repo: String!, $owner: String!, $expression: String!) {
      repository(name: $repo, owner: $owner) {
        object(expression: $expression) {
          ... on Blob {
            text
          }
        }
      }
    }
  `;

  return async function loadFile(file: {
    ref: string;
    path: string;
    workspace?: string;
  }): Promise<string> {
    if (file.workspace) {
      return readFileSync(resolve(file.workspace, file.path), {
        encoding: 'utf-8',
      });
    }

    const result: any = await octokit.graphql(query, {
      repo,
      owner,
      expression: `${file.ref}:${file.path}`,
    });
    core.info(`Query ${file.ref}:${file.path} from ${owner}/${repo}`);

    try {
      if (
        result?.repository?.object?.text
      ) {
        return result.repository.object.text;
      }

      throw new Error('result.repository.object.text is null');
    } catch (error) {
      console.log(result);
      console.error(error);
      throw new Error(`Failed to load '${file.path}' (ref: ${file.ref})`);
    }
  };
}

type UpdateCheckRunOptions = Required<
  Pick<Octokit.ChecksUpdateParams, 'conclusion' | 'output'>
>;
async function updateCheckRun(
  octokit: OctokitInstance,
  checkId: number,
  {conclusion, output}: UpdateCheckRunOptions,
) {
  core.info(`Updating check: ${checkId}`);
  await octokit.checks.update({
    check_run_id: checkId,
    completed_at: new Date().toISOString(),
    status: 'completed',
    ...github.context.repo,
    conclusion,
    output,
  });

  // Fail
  if (conclusion === CheckConclusion.Failure) {
    return core.setFailed(output.title!);
  }

  // Success or Neutral
}

/**
 * Treats non-falsy value as true
 */
function castToBoolean(value: string | boolean, defaultValue?: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === 'false') {
    return value === 'true';
  }

  if (typeof defaultValue === 'boolean') {
    return defaultValue;
  }

  return true;
}
