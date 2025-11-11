import { resolve } from 'path';
import { buildSchema } from 'graphql';
import yargs from 'yargs';
import { mockCommand } from '@graphql-inspector/commands';
import { mockLogger, unmockLogger } from '@graphql-inspector/logger';
import createCommand from '../src/index.js';

/*
 * yargs copies value of `process.exit` in `lib/platform-shims/esm.mjs` file,
 * but after our vitest mocking of `process.exit` doesn't work and exits Node.js process with
 * Error: process.exit called with "1"
 */
vi.mock('yargs', async () => {
  const yargsPath = require.resolve('yargs').replace('index.cjs', '');
  const { YargsFactory } = await vi.importActual(yargsPath + 'build/lib/yargs-factory.js');
  const { default: esmPlatformShim } = await vi.importActual(
    yargsPath + 'lib/platform-shims/esm.mjs',
  );
  return {
    default: YargsFactory({
      ...esmPlatformShim,
      process: {
        ...esmPlatformShim.process,
        exit: () => null,
      },
    }),
  };
});

const oldSchema = buildSchema(/* GraphQL */ `
  type Post {
    id: ID
    title: String
    createdAt: String
    modifiedAt: String
  }

  type Query {
    post: Post!
  }
`);
const newSchema = buildSchema(/* GraphQL */ `
  type Post {
    id: ID!
    title: String!
    createdAt: String!
  }

  type Query {
    post: Post!
  }
`);

const diff = createCommand({
  config: {
    commands: [],
    loaders: [],
  },
  loaders: {
    loadSchema: pointer => (pointer.includes('old') ? oldSchema : newSchema),
  },
});

describe('diff', () => {
  let spyReporter: vi.SpyInstance;
  let spyProcessExit: vi.SpyInstance;
  let spyProcessCwd: vi.SpyInstance;

  beforeEach(() => {
    yargs();
    spyProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => null);
    spyProcessCwd = vi.spyOn(process, 'cwd').mockImplementation(() => __dirname);
    spyReporter = vi.fn();
    mockLogger(spyReporter);
  });

  afterEach(() => {
    yargs();
    unmockLogger();
    spyProcessExit.mockRestore();
    spyProcessCwd.mockRestore();
    spyReporter.mockRestore();
  });

  test('should load graphql file', async () => {
    await mockCommand(diff, 'diff old.graphql old.graphql');

    expect(spyReporter).toHaveBeenCalledNormalized('No changes detected');
    expect(spyReporter).not.toHaveBeenCalledNormalized('Detected the following changes');
  });

  test('should load different schema from graphql file', async () => {
    await mockCommand(diff, 'diff old.graphql new.graphql');

    expect(spyReporter).not.toHaveBeenCalledWith('No changes detected');
    expect(spyReporter).toHaveBeenCalledNormalized(
      'Detected the following changes (4) between schemas:',
    );

    expect(spyProcessExit).toHaveBeenCalledWith(1);
  });

  test('should load rule by name', async () => {
    await mockCommand(diff, 'diff old.graphql new.graphql --rule suppressRemovalOfDeprecatedField');

    expect(spyReporter).not.toHaveBeenCalledNormalized('does not exist');
  });

  test('should load cjs rules with local path from fs', async () => {
    await mockCommand(diff, 'diff old.graphql new.graphql --rule ./assets/rule.cjs');

    expect(spyReporter).not.toHaveBeenCalledNormalized('does not exist');
  });

  test('should load esm rules with local path from fs', async () => {
    await mockCommand(diff, 'diff old.graphql new.graphql --rule ./assets/rule.js');

    expect(spyReporter).not.toHaveBeenCalledNormalized('does not exist');
  });

  test('should load typescript rules with local path from fs', async () => {
    await mockCommand(diff, 'diff old.graphql new.graphql --rule ./assets/rule.ts --register ts-node/register');

    expect(spyReporter).not.toHaveBeenCalledNormalized('does not exist');
  });

  test('should load rules with absolute path from fs', async () => {
    await mockCommand(
      diff,
      `diff old.graphql new.graphql --rule ${resolve(__dirname, 'assets/rule.cjs')}`,
    );

    expect(spyReporter).not.toHaveBeenCalledNormalized('does not exist');
  });

  test('should render error if file does not exist (--rule)', async () => {
    await expect(mockCommand(diff, `diff old.graphql new.graphql --rule noop.js`)).rejects.toThrow(
      /does not exist/,
    );
    expect(spyReporter).toHaveBeenCalledNormalized('does not exist');
  });

  test('should render error if file does not exist', async () => {
    await mockCommand(
      diff,
      `diff old.graphql new.graphql --onComplete ${resolve(__dirname, 'assets/on-complete.cjs')}`,
    );

    expect(spyProcessExit).toHaveBeenCalledWith(2);
  });

  test('should render error if file does not exist (--onComplete)', async () => {
    await expect(
      mockCommand(diff, `diff old.graphql new.graphql --onComplete noop.js`),
    ).rejects.toThrow(/does not exist/);
    expect(spyReporter).toHaveBeenCalledNormalized('does not exist');
  });
});
