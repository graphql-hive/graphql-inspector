import type { MockedFunction } from 'vitest';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { AnnotationFilterLevel, CheckConclusion } from '../helpers/types.js';
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

describe('Inspector Action', () => {
  const mockLoadFile = vi.fn();
  const mockCreateCheck = vi.fn();

  function setInputs(inputs: Record<string, string>) {
    vi.spyOn(core, 'getInput').mockImplementation(name => {
      const values: Record<string, string> = {
        'github-token': 'MOCK_GITHUB_TOKEN',
        schema: 'master:schema.graphql',
        ...inputs,
      };
      return values[name] || '';
    });
  }

  // Produces one breaking, one dangerous and one safe change
  function mockSchemasWithAllChangeLevels() {
    mockLoadFile
      .mockResolvedValueOnce(/* GraphQL */ `
        type Query {
          value: String
          choice: Choice
        }
        enum Choice {
          A
        }
      `)
      .mockResolvedValueOnce(/* GraphQL */ `
        type Query {
          value: Int # Breaking: field type changed from String to Int
          choice: Choice
          added: String # Safe: field added
        }
        enum Choice {
          A
          B # Dangerous: enum value added
        }
      `);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFile.mockReset();
    mockUpdateCheckRun.mockClear();

    // Mock error/warning/info/debug
    vi.spyOn(core, 'error').mockImplementation(vi.fn());
    vi.spyOn(core, 'warning').mockImplementation(vi.fn());
    vi.spyOn(core, 'info').mockImplementation(vi.fn());
    vi.spyOn(core, 'debug').mockImplementation(vi.fn());
    vi.spyOn(core, 'setOutput').mockImplementation(vi.fn());
    vi.spyOn(core, 'setFailed').mockImplementation(vi.fn());

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
          create: mockCreateCheck.mockResolvedValue({
            data: {
              id: '2',
              html_url: 'https://github.com/some-owner/graphql-inspector/runs/2',
            },
          }),
        },
      },
    } as unknown as ReturnType<typeof github.getOctokit>);
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
    } as PullRequest);
    mockFileLoader.mockReturnValue(mockLoadFile);

    process.env.GITHUB_WORKSPACE = '/workspace';
  });

  describe('annotation-level', () => {
    beforeEach(() => {
      mockSchemasWithAllChangeLevels();
    });

    it.each([
      { level: '', levels: ['failure', 'notice', 'warning'] },
      { level: AnnotationFilterLevel.All, levels: ['failure', 'notice', 'warning'] },
      { level: AnnotationFilterLevel.Dangerous, levels: ['failure', 'warning'] },
      { level: AnnotationFilterLevel.Breaking, levels: ['failure'] },
    ])('filters at "$level" without changing the summary or failure', async ({ level, levels }) => {
      setInputs({ 'annotation-level': level });

      await run();

      const result = mockUpdateCheckRun.mock.calls[0][2];
      expect(result.conclusion).toBe(CheckConclusion.Failure);
      expect(result.output.annotations?.map(a => a.annotation_level).sort()).toEqual(levels);
      expect(result.output.summary).toContain('Found 3 changes');
      expect(result.output.summary).toContain('Breaking: 1');
      expect(result.output.summary).toContain('Dangerous: 1');
      expect(result.output.summary).toContain('Safe: 1');
      expect(core.setOutput).toHaveBeenCalledWith('changes', '3');
    });

    it('disables all annotations when annotations is false', async () => {
      setInputs({ 'annotation-level': AnnotationFilterLevel.Breaking, annotations: 'false' });

      await run();

      const result = mockUpdateCheckRun.mock.calls[0][2];
      expect(result.output.annotations).toEqual([]);
      expect(result.conclusion).toBe(CheckConclusion.Failure);
      expect(result.output.summary).toContain('Found 3 changes');
    });

    it.each(['approve-label', 'fail-on-breaking'])('preserves the %s override', async override => {
      setInputs({
        'annotation-level': AnnotationFilterLevel.Breaking,
        [override]: override === 'approve-label' ? 'expected-breaking-change' : 'false',
      });
      if (override === 'approve-label') {
        mockGetAssociatedPullRequest.mockResolvedValue({
          state: 'open',
          number: 1,
          labels: [{ name: 'expected-breaking-change' }],
          base: { ref: 'master' },
        } as PullRequest);
      }

      await run();

      const result = mockUpdateCheckRun.mock.calls[0][2];
      expect(result.conclusion).toBe(CheckConclusion.Success);
      expect(result.output.annotations?.map(a => a.annotation_level)).toEqual(['failure']);
      expect(result.output.summary).toContain('Breaking: 1');
    });

    it('filters using the severity after applying rules', async () => {
      setInputs({
        'annotation-level': AnnotationFilterLevel.Breaking,
        rules: 'example/rules/custom-rule.js',
      });

      await run();

      const result = mockUpdateCheckRun.mock.calls[0][2];
      expect(result.output.annotations).toEqual([]);
      expect(result.conclusion).toBe(CheckConclusion.Success);
      expect(result.output.summary).toContain('Found 3 changes');
      expect(core.setOutput).toHaveBeenCalledWith('changes', '3');
    });

    it('rejects invalid levels before creating a check', async () => {
      setInputs({ 'annotation-level': 'error' });

      await run();

      expect(core.setFailed).toHaveBeenCalledWith(
        'Invalid annotation-level. Expected one of: all, dangerous, breaking.',
      );
      expect(github.getOctokit).not.toHaveBeenCalled();
      expect(mockUpdateCheckRun).not.toHaveBeenCalled();
    });
  });

  describe('outputs', () => {
    it('sets breaking, dangerous and safe change messages', async () => {
      setInputs({});
      mockSchemasWithAllChangeLevels();

      await run();

      expect(core.setOutput).toHaveBeenCalledWith('changes', '3');
      expect(core.setOutput).toHaveBeenCalledWith('breaking-changes', [
        "Field 'Query.value' changed type from 'String' to 'Int'",
      ]);
      expect(core.setOutput).toHaveBeenCalledWith('dangerous-changes', [
        "Enum value 'B' was added to enum 'Choice'",
      ]);
      expect(core.setOutput).toHaveBeenCalledWith('safe-changes', [
        "Field 'added' was added to object type 'Query'",
      ]);
    });

    it('sets empty lists when there are no changes', async () => {
      setInputs({});
      const schema = /* GraphQL */ `
        type Query {
          value: String
        }
      `;
      mockLoadFile.mockResolvedValueOnce(schema).mockResolvedValueOnce(schema);

      await run();

      expect(core.setOutput).toHaveBeenCalledWith('changes', '0');
      expect(core.setOutput).toHaveBeenCalledWith('breaking-changes', []);
      expect(core.setOutput).toHaveBeenCalledWith('dangerous-changes', []);
      expect(core.setOutput).toHaveBeenCalledWith('safe-changes', []);
    });

    it('groups changes using the severity after applying rules', async () => {
      // This rule turns all changes into dangerous ones
      setInputs({ rules: 'example/rules/custom-rule.js' });
      mockSchemasWithAllChangeLevels();

      await run();

      expect(core.setOutput).toHaveBeenCalledWith('breaking-changes', []);
      expect(core.setOutput).toHaveBeenCalledWith('dangerous-changes', [
        "Field 'added' was added to object type 'Query'",
        "Field 'Query.value' changed type from 'String' to 'Int'",
        "Enum value 'B' was added to enum 'Choice'",
      ]);
      expect(core.setOutput).toHaveBeenCalledWith('safe-changes', []);
    });
  });

  describe('create-action-check', () => {
    beforeEach(() => {
      mockSchemasWithAllChangeLevels();
    });

    it('creates a check linked from the failure title by default', async () => {
      setInputs({});

      await run();

      expect(mockCreateCheck).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'GraphQL Inspector', status: 'in_progress' }),
      );
      const result = mockUpdateCheckRun.mock.calls[0][2];
      expect(result.conclusion).toBe(CheckConclusion.Failure);
      expect(result.output.title).toBe(
        'Something is wrong with your schema. For more info see: https://github.com/some-owner/graphql-inspector/runs/2',
      );
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    it('skips the check and fails the action on breaking changes when disabled', async () => {
      setInputs({ 'create-action-check': 'false' });

      await run();

      expect(mockCreateCheck).not.toHaveBeenCalled();
      expect(mockUpdateCheckRun).not.toHaveBeenCalled();
      expect(core.setFailed).toHaveBeenCalledWith(CheckConclusion.Failure);
      expect(core.setOutput).toHaveBeenCalledWith('changes', '3');
      expect(core.setOutput).toHaveBeenCalledWith('breaking-changes', [
        "Field 'Query.value' changed type from 'String' to 'Int'",
      ]);
    });

    it.each(['approve-label', 'fail-on-breaking'])(
      'does not fail the action when disabled and %s overrides the conclusion',
      async override => {
        setInputs({
          'create-action-check': 'false',
          [override]: override === 'approve-label' ? 'expected-breaking-change' : 'false',
        });
        if (override === 'approve-label') {
          mockGetAssociatedPullRequest.mockResolvedValue({
            state: 'open',
            number: 1,
            labels: [{ name: 'expected-breaking-change' }],
            base: { ref: 'master' },
          } as PullRequest);
        }

        await run();

        expect(mockCreateCheck).not.toHaveBeenCalled();
        expect(mockUpdateCheckRun).not.toHaveBeenCalled();
        expect(core.setFailed).not.toHaveBeenCalled();
      },
    );

    it('does not fail the action when disabled and there are no breaking changes', async () => {
      setInputs({
        'create-action-check': 'false',
        rules: 'example/rules/custom-rule.js',
      });

      await run();

      expect(mockCreateCheck).not.toHaveBeenCalled();
      expect(mockUpdateCheckRun).not.toHaveBeenCalled();
      expect(core.setFailed).not.toHaveBeenCalled();
      expect(core.setOutput).toHaveBeenCalledWith('changes', '3');
    });
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
});
