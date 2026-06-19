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

const mockUpdateCheckRun = updateCheckRun as vi.MockedFunction<typeof updateCheckRun>;
const mockFileLoader = fileLoader as vi.MockedFunction<typeof fileLoader>;
const mockGetAssociatedPullRequest = getAssociatedPullRequest as vi.MockedFunction<
  typeof getAssociatedPullRequest
>;

describe('Inspector Action', () => {
  const mockLoadFile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock error/warning/info/debug
    vi.spyOn(core, 'error').mockImplementation(vi.fn());
    vi.spyOn(core, 'warning').mockImplementation(vi.fn());
    vi.spyOn(core, 'info').mockImplementation(vi.fn());
    vi.spyOn(core, 'debug').mockImplementation(vi.fn());

    vi.spyOn(core, 'getInput').mockImplementation((name: string, _options) => {
      switch (name) {
        case 'github-token':
          return 'MOCK_GITHUB_TOKEN';
        case 'schema':
          return 'master:schema.graphql';
        default:
          return '';
      }
    });

    vi.spyOn(github, 'getOctokit').mockReturnValue({
      rest: {
        checks: {
          create: vi.fn().mockResolvedValue({
            data: {
              id: '2',
            },
          }),
        },
      },
    });
    vi.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return {
        owner: 'some-owner',
        repo: 'graphql-inspector',
      };
    });

    mockGetAssociatedPullRequest.mockResolvedValue({
      state: 'open',
      number: 1,
      base: {
        ref: 'master',
      },
    });
    mockFileLoader.mockReturnValue(mockLoadFile);

    process.env.GITHUB_WORKSPACE = '/workspace';
  });

  describe('rules', () => {
    it('should accept a rules list with 1 built in rule', async () => {
      vi.spyOn(core, 'getInput').mockImplementation((name: string, _options) => {
        switch (name) {
          case 'github-token':
            return 'MOCK_GITHUB_TOKEN';
          case 'schema':
            return 'master:schema.graphql';
          case 'rules':
            return `
        suppressRemovalOfDeprecatedField
        `;
          default:
            return '';
        }
      });

      mockLoadFile
        .mockResolvedValueOnce(/* GraphQL */ `
          type Query {
            oldQuery: OldType @deprecated(reason: "use newQuery")
            newQuery: Int!
          }

          type OldType {
            field: String!
          }
        `)
        .mockResolvedValueOnce(/* GraphQL */ `
          type Query {
            newQuery: Int!
          }
        `);

      await run();

      expect(mockUpdateCheckRun).toBeCalledWith(expect.anything(), '2', {
        conclusion: CheckConclusion.Success,
        output: {
          title: 'Everything looks good',
          summary: expect.stringContaining('Found 2 changes'),
          annotations: [
            {
              annotation_level: 'warning',
              end_line: 1,
              message: "Type 'OldType' was removed",
              path: 'schema.graphql',
              start_line: 1,
              title: "Type 'OldType' was removed",
            },
            {
              annotation_level: 'warning',
              end_line: 2,
              message: expect.any(String),
              path: 'schema.graphql',
              start_line: 2,
              title: "Field 'oldQuery' (deprecated) was removed from object type 'Query'",
            },
          ],
        },
      });
    });

    it('should accept a rules list with 1 custom rule', async () => {
      vi.spyOn(core, 'getInput').mockImplementation((name: string, _options) => {
        switch (name) {
          case 'github-token':
            return 'MOCK_GITHUB_TOKEN';
          case 'schema':
            return 'master:schema.graphql';
          case 'rules':
            // This rule turns all changes from breaking to dangerous
            return `
        example/rules/custom-rule.js
        `;
          default:
            return '';
        }
      });

      mockLoadFile
        .mockResolvedValueOnce(/* GraphQL */ `
          type Query {
            oldQuery: OldType @deprecated(reason: "use newQuery")
            newQuery: Int!
          }

          type OldType {
            field: String!
          }
        `)
        .mockResolvedValueOnce(/* GraphQL */ `
          type Query {
            newQuery: Int!
          }
        `);

      await run();

      expect(mockUpdateCheckRun).toBeCalledWith(expect.anything(), '2', {
        conclusion: CheckConclusion.Success,
        output: {
          title: 'Everything looks good',
          summary: expect.stringContaining('Found 2 changes'),
          annotations: [
            {
              annotation_level: 'warning',
              end_line: 1,
              message: "Type 'OldType' was removed",
              path: 'schema.graphql',
              start_line: 1,
              title: "Type 'OldType' was removed",
            },
            {
              annotation_level: 'warning',
              end_line: 2,
              message: expect.any(String),
              path: 'schema.graphql',
              start_line: 2,
              title: "Field 'oldQuery' (deprecated) was removed from object type 'Query'",
            },
          ],
        },
      });
    });

    it('should accept a rules list with a built-in and a custom rule', async () => {
      vi.spyOn(core, 'getInput').mockImplementation((name: string, _options) => {
        switch (name) {
          case 'github-token':
            return 'MOCK_GITHUB_TOKEN';
          case 'schema':
            return 'master:schema.graphql';
          case 'rules':
            return `
          suppressRemovalOfDeprecatedField
          example/rules/custom-rule.js
          `;
          default:
            return '';
        }
      });

      mockLoadFile
        .mockResolvedValueOnce(/* GraphQL */ `
          type Query {
            oldQuery: OldType @deprecated(reason: "use newQuery")
            newQuery: Int!
          }

          type OldType {
            field: String!
          }
        `)
        .mockResolvedValueOnce(/* GraphQL */ `
          type Query {
            newQuery: Int!
          }
        `);

      await run();

      expect(mockUpdateCheckRun).toBeCalledWith(expect.anything(), '2', {
        conclusion: CheckConclusion.Success,
        output: {
          title: 'Everything looks good',
          summary: expect.stringContaining('Found 2 changes'),
          annotations: [
            {
              annotation_level: 'warning',
              end_line: 1,
              message: "Type 'OldType' was removed",
              path: 'schema.graphql',
              start_line: 1,
              title: "Type 'OldType' was removed",
            },
            {
              annotation_level: 'warning',
              end_line: 2,
              message: expect.any(String),
              path: 'schema.graphql',
              start_line: 2,
              title: "Field 'oldQuery' (deprecated) was removed from object type 'Query'",
            },
          ],
        },
      });
    });
  });

  describe('messages', () => {
    it('should accept a success message', async () => {
      vi.spyOn(core, 'getInput').mockImplementation((name: string, _options) => {
        switch (name) {
          case 'github-token':
            return 'MOCK_GITHUB_TOKEN';
          case 'schema':
            return 'master:schema.graphql';
          case 'rules':
            return `
        suppressRemovalOfDeprecatedField
        `;
          case 'success-title':
            return 'Your schema is good to go!!!';
          default:
            return '';
        }
      });

      mockLoadFile
        .mockResolvedValueOnce(/* GraphQL */ `
          type Query {
            oldQuery: OldType @deprecated(reason: "use newQuery")
            newQuery: Int!
          }

          type OldType {
            field: String!
          }
        `)
        .mockResolvedValueOnce(/* GraphQL */ `
          type Query {
            newQuery: Int!
          }
        `);

      await run();

      expect(mockUpdateCheckRun).toBeCalledWith(expect.anything(), '2', {
        conclusion: CheckConclusion.Success,
        output: expect.objectContaining({
          title: 'Your schema is good to go!!!'
         }),
      });
    });

    it('should accept a failure message', async () => {
      vi.spyOn(core, 'getInput').mockImplementation((name: string, _options) => {
        switch (name) {
          case 'github-token':
            return 'MOCK_GITHUB_TOKEN';
          case 'schema':
            return 'master:schema.graphql';
          case 'rules':
            return `
        suppressRemovalOfDeprecatedField
        `;
          case 'failure-title':
            return 'Your schema is broken!!!';
          default:
            return '';
        }
      });

      mockLoadFile
        .mockResolvedValueOnce(/* GraphQL */ `
          type Query {
            oldQuery: OldType
            newQuery: Int!
          }

          type OldType {
            field: String!
          }
        `)
        .mockResolvedValueOnce(/* GraphQL */ `
          type Query {
            newQuery: Int!
          }
        `);

      await run();

      expect(mockUpdateCheckRun).toBeCalledWith(expect.anything(), '2', {
        conclusion: CheckConclusion.Failure,
        output:  expect.objectContaining({
          title: 'Your schema is broken!!!'
         }),
      });
    });
    
  });

});
