import { createServer } from 'http';
import { createYoga } from 'graphql-yoga';
import open from 'open';
import {
  CommandFactory,
  createCommand,
  GlobalArgs,
  parseGlobalArgs,
} from '@graphql-inspector/commands';
import { Logger } from '@graphql-inspector/logger';
import { fake } from './fake.js';

export { CommandFactory };

export default createCommand<
  {},
  {
    schema: string;
    port: number;
  } & GlobalArgs
>(api => {
  const { loaders } = api;

  return {
    command: 'serve <schema>',
    describe: 'Runs server with fake data based on schema',
    builder(yargs) {
      return yargs
        .positional('schema', {
          describe: 'Point to a schema',
          type: 'string',
          demandOption: true,
        })
        .options({
          port: {
            alias: 'p',
            describe: 'Port',
            type: 'number',
            default: 4000,
          },
        });
    },
    async handler(args) {
      const { headers, token } = parseGlobalArgs(args);
      const apolloFederation = args.federation || false;
      const apolloFederationV2 = args.federationV2 || false;
      const aws = args.aws || false;
      const method = args.method?.toUpperCase() || 'POST';

      const schema = await loaders.loadSchema(
        args.schema,
        {
          headers,
          token,
          method,
        },
        apolloFederation,
        apolloFederationV2,
        aws,
      );

      const port = args.port;

      try {
        fake(schema);

        const yoga = createYoga({
          schema,
          logging: false,
        });

        const server = createServer(yoga);

        await new Promise<void>(resolve => server.listen(port, () => resolve()));

        const url = `http://localhost:${port}/graphql`;
        Logger.success(`GraphQL API:    ${url}`);
        await open(url);

        const shutdown = () => {
          server.close(() => {
            process.exit(0);
          });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } catch (e: any) {
        Logger.error(e.message || e);
      }
    },
  };
});
