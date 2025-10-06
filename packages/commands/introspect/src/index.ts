import { writeFileSync } from 'fs';
import { extname, resolve } from 'path';
import {
  GraphQLSchema,
  introspectionFromSchema,
  lexicographicSortSchema,
  printSchema,
} from 'graphql';
import {
  CommandFactory,
  createCommand,
  GlobalArgs,
  parseGlobalArgs,
} from '@graphql-inspector/commands';
import { Logger } from '@graphql-inspector/logger';

export { CommandFactory };

export function handler({
  schema: unsortedSchema,
  output,
  comments,
}: {
  schema: GraphQLSchema;
  output: string;
  comments: boolean;
}) {
  const schema = lexicographicSortSchema(unsortedSchema);
  const introspection = introspectionFromSchema(schema);
  const filepath = resolve(process.cwd(), output);
  let content: string;

  switch (extname(output.toLowerCase())) {
    case '.graphql':
    case '.gql':
    case '.gqls':
    case '.graphqls':
      content = (printSchema as any)(schema, {
        commentDescriptions: comments,
      });
      break;
    case '.json':
      content = JSON.stringify(introspection, null, 2);
      break;
    default:
      throw new Error('Only .graphql, .gql and .json files are supported');
  }

  writeFileSync(output, content!, 'utf8');

  Logger.success(`Saved to ${filepath}`);
}

export default createCommand<
  {},
  {
    schema: string;
    write?: string;
    comments?: boolean;
  } & GlobalArgs
>(api => {
  const { loaders } = api;

  return {
    command: 'introspect <schema>',
    describe: 'Introspect a schema',
    builder(yargs) {
      return yargs
        .positional('schema', {
          describe: 'Point to a schema',
          type: 'string',
          demandOption: true,
        })
        .options({
          w: {
            alias: 'write',
            describe: 'Write to a file',
            type: 'string',
          },
          comments: {
            describe: 'Use preceding comments as the description',
            type: 'boolean',
          },
        })
        .default('w', 'graphql.schema.json');
    },
    async handler(args) {
      const { headers, token } = parseGlobalArgs(args);
      const output = args.write!;
      const comments = args.comments || false;
      const apolloFederation = args.federation || false;
      const apolloFederationV2 = args.federationV2 || false;
      const aws = args.aws || false;
      const method = args.method?.toUpperCase() || 'POST';

      const schema = await loaders.loadSchema(
        args.schema,
        {
          token,
          headers,
          method,
        },
        apolloFederation,
        apolloFederationV2,
        aws,
      );

      return handler({ schema, output, comments });
    },
  };
});
