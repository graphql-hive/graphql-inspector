import { existsSync, readFileSync, unlinkSync } from 'fs';
import { buildSchema } from 'graphql';
import type { Mock, MockInstance } from 'vitest';
import yargs from 'yargs';
import { mockCommand } from '@graphql-inspector/commands';
import { LoadersRegistry } from '@graphql-inspector/loaders';
import { mockLogger, unmockLogger } from '@graphql-inspector/logger';
import { mockGraphQLServer } from '@graphql-inspector/testing';
import loader from '@graphql-inspector/url-loader';
import createCommand from '../src/index.js';

function sleepFor(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const schema = buildSchema(/* GraphQL */ `
  type Post {
    id: ID!
    title: String!
    createdAt: String!
  }

  type Query {
    post: Post!
  }
`);

const loaders = new LoadersRegistry();

loaders.register(loader);

const introspect = createCommand({
  config: {
    commands: [],
    loaders: [],
  },
  loaders,
});

describe('introspect', () => {
  let spyReporter: Mock<(msg: string) => void>;
  let spyProcessCwd: MockInstance;

  beforeEach(() => {
    yargs();
    spyProcessCwd = vi.spyOn(process, 'cwd').mockImplementation(() => __dirname);
    spyReporter = vi.fn();
    mockLogger(spyReporter);
  });

  afterEach(() => {
    yargs();
    unmockLogger();
    spyProcessCwd.mockRestore();
    spyReporter.mockRestore();
    try {
      unlinkSync('graphql.schema.json');
    } catch {
      /* ignore */
    }
  });

  test('graphql api with port and ws in name using url-loader', async () => {
    const done = mockGraphQLServer({
      schema,
      host: 'http://foo.ws:8020',
      path: '/graphql',
    });
    await mockCommand(introspect, 'introspect http://foo.ws:8020/graphql');
    await sleepFor(500);

    done();
    expect(existsSync('graphql.schema.json')).toBe(true);
  });

  test('saved to graphql files using url-loader', async () => {
    const done = mockGraphQLServer({
      schema,
      host: 'https://example.com',
      path: '/graphql',
    });
    await mockCommand(introspect, 'introspect https://example.com/graphql -w schema.graphql');
    await sleepFor(500);

    done();
    expect(existsSync('schema.graphql')).toBe(true);
    const printed = readFileSync('schema.graphql', 'utf8');
    unlinkSync('schema.graphql');

    const builtSchema = buildSchema(printed);

    expect(builtSchema.getQueryType()!.getFields()).toHaveProperty('post');
  });

  test('saved to graphql files using url-loader by GET method', async () => {
    const done = mockGraphQLServer({
      schema,
      host: 'https://example.com',
      path: '/graphql',
      method: 'GET',
    });
    await mockCommand(
      introspect,
      'introspect https://example.com/graphql -w schema.graphql --method GET',
    );
    await sleepFor(500);

    done();
    expect(existsSync('schema.graphql')).toBe(true);
    const printed = readFileSync('schema.graphql', 'utf8');
    unlinkSync('schema.graphql');

    const builtSchema = buildSchema(printed);

    expect(builtSchema.getQueryType()!.getFields()).toHaveProperty('post');
  });

  describe('introspection options', () => {
    const richSchema = buildSchema(/* GraphQL */ `
      directive @tag(name: String) repeatable on FIELD_DEFINITION

      input PostFilter {
        oldStatus: String @deprecated(reason: "Use status")
        status: String
      }

      type Query {
        posts(where: PostFilter): [String!] @tag(name: "a") @tag(name: "b")
      }
    `);

    async function introspectWith(flags: string) {
      const done = mockGraphQLServer({
        schema: richSchema,
        host: 'https://example.com',
        path: '/graphql',
      });
      await mockCommand(
        introspect,
        `introspect https://example.com/graphql -w schema.graphql ${flags}`,
      );
      await sleepFor(500);
      done();
      const printed = readFileSync('schema.graphql', 'utf8');
      unlinkSync('schema.graphql');
      return printed;
    }

    test('omits deprecated input fields and repeatable by default', async () => {
      const printed = await introspectWith('');

      expect(printed).not.toContain('oldStatus');
      expect(printed).not.toContain('repeatable');
    });

    test('includes deprecated input fields and repeatable when requested', async () => {
      const printed = await introspectWith(
        '--include-deprecated-input-values --include-repeatable-directives',
      );

      expect(printed).toContain('oldStatus: String @deprecated(reason: "Use status")');
      expect(printed).toContain('directive @tag(name: String) repeatable on FIELD_DEFINITION');
    });
  });
});
