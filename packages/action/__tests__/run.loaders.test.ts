import { createSchema, createYoga } from 'graphql-yoga';
import type { MockedFunction } from 'vitest';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { CheckConclusion } from '../helpers/types.js';
import { updateCheckRun } from '../src/checks.js';
import { fileLoader } from '../src/files.js';
import { getAssociatedPullRequest } from '../src/git.js';
import { run } from '../src/run.js';

vi.mock('../src/checks');
vi.mock('../src/git');
vi.mock('../src/files');

const mockUpdateCheckRun = updateCheckRun as MockedFunction<typeof updateCheckRun>;
const mockFileLoader = fileLoader as MockedFunction<typeof fileLoader>;
const mockGetAssociatedPullRequest = getAssociatedPullRequest as MockedFunction<
  typeof getAssociatedPullRequest
>;

type PullRequest = Awaited<ReturnType<typeof getAssociatedPullRequest>>;

const oldTypeDefs = /* GraphQL */ `
  type Query {
    hello: String
  }
`;

const newTypeDefs = /* GraphQL */ `
  type Query {
    hello: String
    added: String
  }
`;

const oldYoga = createYoga({
  schema: createSchema({ typeDefs: oldTypeDefs }),
  logging: false,
});

// GraphQL servers keyed by URL, served in-process through Yoga's fetch: no server needed.
const servers: Record<string, { fetch: (request: Request) => Response | Promise<Response> }> = {
  'http://localhost/old/graphql': oldYoga,
  'http://localhost/new/graphql': createYoga({
    schema: createSchema({ typeDefs: newTypeDefs }),
    logging: false,
  }),
  // Behaves like a Rails/graphql-ruby server: a body that isn't sent as JSON is not parsed,
  // so no query is found and it replies 200 with `errors` and no `data`.
  'http://localhost/rails/graphql': {
    fetch: request =>
      request.headers.get('content-type')?.includes('application/json')
        ? oldYoga.fetch(request)
        : Response.json({ errors: [{ message: 'No query string was present' }] }),
  },
};

vi.mock('@whatwg-node/fetch', async importOriginal => {
  const original = await importOriginal<typeof import('@whatwg-node/fetch')>();
  return {
    ...original,
    fetch: async (input: string, init?: RequestInit) => {
      const server = servers[input];
      if (!server) {
        throw new Error(`No mock GraphQL server for ${input}`);
      }
      return server.fetch(new original.Request(input, init));
    },
  };
});

function setInputs({ inputs }: { inputs: Record<string, string> }): void {
  vi.spyOn(core, 'getInput').mockImplementation(name => {
    const values = {
      'github-token': 'MOCK_GITHUB_TOKEN',
      ...inputs,
    };
    return values[name] || '';
  });
}

// https://github.com/graphql-hive/graphql-inspector/issues/2876
describe('Inspector Action - endpoint URLs', () => {
  const mockLoadFile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFile.mockReset();

    vi.spyOn(core, 'error').mockImplementation(vi.fn());
    vi.spyOn(core, 'warning').mockImplementation(vi.fn());
    vi.spyOn(core, 'info').mockImplementation(vi.fn());
    vi.spyOn(core, 'debug').mockImplementation(vi.fn());
    vi.spyOn(core, 'setOutput').mockImplementation(vi.fn());
    vi.spyOn(core, 'setFailed').mockImplementation(vi.fn());

    vi.spyOn(github, 'getOctokit').mockReturnValue({
      rest: {
        checks: {
          create: vi.fn().mockResolvedValue({
            data: { id: '2', html_url: 'https://github.com/some-owner/graphql-inspector/runs/2' },
          }),
        },
      },
    } as unknown as ReturnType<typeof github.getOctokit>);
    vi.spyOn(github.context, 'repo', 'get').mockImplementation(() => ({
      owner: 'some-owner',
      repo: 'graphql-inspector',
    }));

    mockGetAssociatedPullRequest.mockResolvedValue({
      state: 'open',
      number: 1,
      base: { ref: 'master' },
    } as PullRequest);
    mockFileLoader.mockReturnValue(mockLoadFile);

    process.env.GITHUB_WORKSPACE = '/workspace';
  });

  it('compares an URL endpoint (before) to a file (after)', async () => {
    setInputs({
      inputs: {
        endpoint: 'http://localhost/old/graphql',
        schema: 'schema.graphql',
      },
    });
    mockLoadFile.mockResolvedValueOnce(newTypeDefs);

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    const result = mockUpdateCheckRun.mock.calls[0][2];
    expect(result.conclusion).toBe(CheckConclusion.Success);
    expect(result.output.summary).toContain('Found 1 change');
  });

  it('compares an URL endpoint (before) that only accepts JSON requests (Rails-like) to a schema file (after)', async () => {
    setInputs({
      inputs: {
        endpoint: 'http://localhost/rails/graphql',
        schema: 'schema.graphql',
      },
    });
    mockLoadFile.mockResolvedValueOnce(newTypeDefs);

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    const result = mockUpdateCheckRun.mock.calls[0][2];
    expect(result.conclusion).toBe(CheckConclusion.Success);
    expect(result.output.summary).toContain('Found 1 change');
  });

  it('compares an URL endpoint (before) to a schema URL (after) that only accepts JSON requests (Rails-like)', async () => {
    setInputs({
      inputs: {
        endpoint: 'http://localhost/old/graphql',
        schema: 'http://localhost/rails/graphql',
      },
    });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(mockLoadFile).not.toHaveBeenCalled();
    const result = mockUpdateCheckRun.mock.calls[0][2];
    expect(result.conclusion).toBe(CheckConclusion.Success);
  });

  it('compares an URL endpoint (before) to a schema URL (after)', async () => {
    setInputs({
      inputs: {
        endpoint: 'http://localhost/old/graphql',
        schema: 'http://localhost/new/graphql',
      },
    });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(mockLoadFile).not.toHaveBeenCalled();
    const result = mockUpdateCheckRun.mock.calls[0][2];
    expect(result.conclusion).toBe(CheckConclusion.Success);
    expect(result.output.summary).toContain('Found 1 change');
  });
});
