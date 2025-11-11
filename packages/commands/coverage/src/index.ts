import { writeFileSync } from 'fs';
import { extname } from 'path';
import { GraphQLSchema, print, Source } from 'graphql';
import {
  CommandFactory,
  createCommand,
  ensureAbsolute,
  GlobalArgs,
  parseGlobalArgs,
} from '@graphql-inspector/commands';
import {
  coverage as calculateCoverage,
  getTypePrefix,
  SchemaCoverage,
} from '@graphql-inspector/core';
import { chalk, Logger } from '@graphql-inspector/logger';
import { Source as DocumentSource } from '@graphql-tools/utils';

export { CommandFactory };

export function handler({
  schema,
  documents,
  silent,
  writePath,
}: {
  schema: GraphQLSchema;
  documents: DocumentSource[];
  silent?: boolean;
  writePath?: string;
}) {
  const shouldWrite = typeof writePath !== 'undefined';
  const coverage = calculateCoverage(
    schema,
    documents.map(doc => new Source(print(doc.document!), doc.location)),
  );

  if (silent !== true) {
    renderCoverage(coverage);
  }

  if (shouldWrite) {
    if (typeof writePath !== 'string') {
      throw new Error(`--write is not valid file path: ${writePath}`);
    }

    const absPath = ensureAbsolute(writePath);
    const ext = extname(absPath).replace('.', '').toLocaleLowerCase();

    let output: string | undefined = undefined;

    if (ext === 'json') {
      output = outputJSON(coverage);
    }

    if (output) {
      writeFileSync(absPath, output, 'utf8');
      Logger.success(`Available at ${absPath}\n`);
    } else {
      throw new Error(`Extension ${ext} is not supported`);
    }
  }
}

export default createCommand<
  {},
  {
    schema: string;
    documents: string;
    write?: string;
    silent?: boolean;
  } & GlobalArgs
>(api => {
  const { loaders } = api;

  return {
    command: 'coverage <documents> <schema>',
    describe: 'Schema coverage based on documents',
    builder(yargs) {
      return yargs
        .positional('schema', {
          describe: 'Point to a schema',
          type: 'string',
          demandOption: true,
        })
        .positional('documents', {
          describe: 'Point to documents',
          type: 'string',
          demandOption: true,
        })
        .options({
          w: {
            alias: 'write',
            describe: 'Write a file with coverage stats',
            type: 'string',
          },
          s: {
            alias: 'silent',
            describe: 'Do not render any stats in the terminal',
            type: 'boolean',
          },
        });
    },
    async handler(args) {
      const writePath = args.write;
      const silent = args.silent;
      const { headers, token } = parseGlobalArgs(args);
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
      const documents = await loaders.loadDocuments(args.documents);

      return handler({ schema, documents, silent, writePath });
    },
  };
});

function outputJSON(coverage: SchemaCoverage): string {
  return JSON.stringify(coverage, null, 2);
}

function renderCoverage(coverage: SchemaCoverage) {
  Logger.info('Schema coverage based on documents:\n');

  for (const typeName in coverage.types) {
    if (Object.prototype.hasOwnProperty.call(coverage.types, typeName)) {
      const typeCoverage = coverage.types[typeName];

      Logger.log(
        [
          chalk.grey(getTypePrefix(typeCoverage.type)),
          chalk.bold(String(typeName)),
          chalk.grey('{'),
        ].join(' '),
      );

      for (const childName in typeCoverage.children) {
        if (Object.prototype.hasOwnProperty.call(typeCoverage.children, childName)) {
          const childCoverage = typeCoverage.children[childName];

          if (childCoverage.hits) {
            Logger.log(
              [indent(childName, 2), chalk.italic.grey(`x ${childCoverage.hits}`)].join(' '),
            );
          } else {
            Logger.log([chalk.redBright(indent(childName, 2)), chalk.italic.grey('x 0')].join(' '));
          }
        }
      }

      Logger.log(chalk.grey('}\n'));
    }
  }

  const logStatsResult: { method: string; result: string }[] = [
    {
      method: 'Types covered',
      result: `${
        coverage.stats.numTypes > 0
          ? ((coverage.stats.numTypesCovered / coverage.stats.numTypes) * 100).toFixed(1)
          : 'N/A'
      }%`,
    },
    {
      method: 'Types covered fully',
      result: `${
        coverage.stats.numTypes > 0
          ? ((coverage.stats.numTypesCoveredFully / coverage.stats.numTypes) * 100).toFixed(1)
          : 'N/A'
      }%`,
    },
    {
      method: 'Fields covered',
      result: `${
        coverage.stats.numFields > 0
          ? ((coverage.stats.numFiledsCovered / coverage.stats.numFields) * 100).toFixed(1)
          : 'N/A'
      }%`,
    },
    {
      method: 'Total Queries',
      result: String(coverage.stats.numQueries > 0 ? coverage.stats.numQueries : '0'),
    },
    {
      method: 'Covered Queries',
      result: String(coverage.stats.numCoveredQueries > 0 ? coverage.stats.numCoveredQueries : '0'),
    },
    {
      method: 'Total Mutations',
      result: String(coverage.stats.numMutations > 0 ? coverage.stats.numMutations : '0'),
    },
    {
      method: 'Covered Mutations',
      result: String(
        coverage.stats.numCoveredMutations > 0 ? coverage.stats.numCoveredMutations : '0',
      ),
    },
    {
      method: 'Total Subscriptions',
      result: String(coverage.stats.numSubscriptions > 0 ? coverage.stats.numSubscriptions : '0'),
    },
    {
      method: 'Covered Subscriptions',
      result: String(
        coverage.stats.numCoveredSubscriptions > 0 ? coverage.stats.numCoveredSubscriptions : '0',
      ),
    },
  ];
  Logger.table(logStatsResult);
  Logger.log(``);
}
function indent(line: string, space: number): string {
  return line.padStart(line.length + space, ' ');
}
