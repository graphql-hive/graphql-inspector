import * as core from '@actions/core';
import * as github from '@actions/github';
import { CheckConclusion } from '../helpers/types.js';
import { updateCheckRun } from '../src/checks.js';
import { OctokitInstance } from '../src/types.js';

function httpError(status: number) {
  return Object.assign(new Error(status === 404 ? 'Not Found' : `HTTP ${status}`), { status });
}

describe('updateCheckRun', () => {
  const update = vi.fn();
  const octokit = { rest: { checks: { update } } } as unknown as OctokitInstance;
  const options = {
    conclusion: CheckConclusion.Success,
    output: { title: 'Everything looks good', summary: 'No changes', annotations: [] },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    update.mockReset();
    vi.spyOn(core, 'info').mockImplementation(vi.fn());
    vi.spyOn(core, 'warning').mockImplementation(vi.fn());
    vi.spyOn(core, 'error').mockImplementation(vi.fn());
    vi.spyOn(core, 'setFailed').mockImplementation(vi.fn());
    vi.spyOn(github.context, 'repo', 'get').mockImplementation(() => ({
      owner: 'some-owner',
      repo: 'graphql-inspector',
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes the check run when the first update returns 404 and a retry succeeds', async () => {
    update.mockRejectedValueOnce(httpError(404)).mockResolvedValue({ data: {} });

    const result = updateCheckRun(octokit, 1, options);
    await vi.runAllTimersAsync();
    await result;

    // two completion attempts, then one annotations update
    expect(update).toHaveBeenCalledTimes(3);
    expect(update.mock.calls[1][0]).toMatchObject({
      check_run_id: 1,
      status: 'completed',
      conclusion: CheckConclusion.Success,
    });
    expect(core.warning).toHaveBeenCalledTimes(1);
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('retries the annotations update when it returns 404 after the check run was completed', async () => {
    update
      .mockResolvedValueOnce({ data: {} })
      .mockRejectedValueOnce(httpError(404))
      .mockResolvedValue({ data: {} });

    const result = updateCheckRun(octokit, 1, options);
    await vi.runAllTimersAsync();
    await result;

    expect(update).toHaveBeenCalledTimes(3);
    expect(update.mock.calls[2][0]).toMatchObject({ check_run_id: 1, output: { annotations: [] } });
    expect(core.error).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('gives up after three retries when the check run stays not found', async () => {
    update.mockRejectedValue(httpError(404));

    const result = updateCheckRun(octokit, 1, options);
    const assertion = expect(result).rejects.toMatchObject({ status: 404 });
    await vi.runAllTimersAsync();
    await assertion;

    expect(update).toHaveBeenCalledTimes(4);
  });

  it('does not retry errors other than 404', async () => {
    update.mockRejectedValue(httpError(403));

    await expect(updateCheckRun(octokit, 1, options)).rejects.toMatchObject({ status: 403 });

    expect(update).toHaveBeenCalledTimes(1);
    expect(core.warning).not.toHaveBeenCalled();
  });
});
