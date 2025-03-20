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

export async function updateCheckRun(
  octokit: OctokitInstance,
  checkId: number,
  { conclusion, output }: UpdateCheckRunOptions,
) {
  core.info(`Updating check: ${checkId}`);

  const { title, summary, annotations = [] } = output;
  const batches = batch(annotations, 50);

  core.info(`annotations to be sent: ${annotations.length}`);

  await octokit.rest.checks.update({
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
    await Promise.all(
      batches.map(async chunk => {
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
      }),
    );
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
