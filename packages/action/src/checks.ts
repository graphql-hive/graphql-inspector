import * as core from '@actions/core';
import * as github from '@actions/github';
import { CheckConclusion } from '../helpers/types.js';
import { OctokitInstance } from './types.js';
import { batch } from './utils.js';

type UpdateCheckRunOptions = Required<
  Pick<
    NonNullable<Parameters<OctokitInstance['rest']['checks']['update']>[0]>,
    'conclusion' | 'output'
  >
>;

type UpdateCheckRunParams = NonNullable<Parameters<OctokitInstance['rest']['checks']['update']>[0]>;

const NOT_FOUND_RETRY_DELAYS_MS = [1000, 2000, 4000];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function completeCheckRun(octokit: OctokitInstance, params: UpdateCheckRunParams) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await octokit.rest.checks.update(params);
    } catch (error: any) {
      const delay = NOT_FOUND_RETRY_DELAYS_MS[attempt];
      if (error?.status !== 404 || delay === undefined) {
        throw error;
      }
      core.warning(
        `Check run ${params.check_run_id} not found yet, retrying in ${delay}ms (attempt ${attempt + 1} of ${NOT_FOUND_RETRY_DELAYS_MS.length})`,
      );
      await sleep(delay);
    }
  }
}

export async function updateCheckRun(
  octokit: OctokitInstance,
  checkId: number,
  { conclusion, output }: UpdateCheckRunOptions,
) {
  core.info(`Updating check: ${checkId}`);

  const { title, summary, annotations = [] } = output;
  const batches = batch(annotations, 50);

  core.info(`annotations to be sent: ${annotations.length}`);

  await completeCheckRun(octokit, {
    check_run_id: checkId,
    completed_at: new Date().toISOString(),
    status: 'completed',
    ...github.context.repo,
    conclusion,
    output: {
      title,
      summary,
    },
  });

  try {
    for (const chunk of batches) {
      await octokit.rest.checks.update({
        check_run_id: checkId,
        ...github.context.repo,
        output: {
          title,
          summary,
          annotations: chunk,
        },
      } as any);
      core.info(`annotations sent (${chunk.length})`);
    }
  } catch (error) {
    core.error(`failed to send annotations: ${error}`);
    throw error;
  }

  // Fail
  if (conclusion === CheckConclusion.Failure) {
    return core.setFailed(output.title!);
  }

  // Success or Neutral
}
