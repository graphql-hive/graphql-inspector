import { writeFileSync } from 'fs';
import { extname } from 'path';
import { GraphQLNamedType, GraphQLSchema } from 'graphql';
import {
  CommandFactory,
  createCommand,
  ensureAbsolute,
  GlobalArgs,
  parseGlobalArgs,
} from '@graphql-inspector/commands';
import { similar as findSimilar, getTypePrefix, Rating, SimilarMap } from '@graphql-inspector/core';
import { chalk, figures, Logger } from '@graphql-inspector/logger';

export { CommandFactory };

export function handler({
  schema,
  writePath,
  type,
  threshold,
}: {
  schema: GraphQLSchema;
  writePath?: string;
  type?: string;
  threshold?: number;
}) {
  const shouldWrite = typeof writePath !== 'undefined';
  const similarMap = findSimilar(schema, type, threshold);

  if (!Object.keys(similarMap).length) {
    Logger.info('No similar types found');
    return;
  }
  for (const typeName in similarMap) {
    if (Object.prototype.hasOwnProperty.call(similarMap, typeName)) {
      const matches = similarMap[typeName];
      const prefix = getTypePrefix(schema.getType(typeName) as GraphQLNamedType);
      const sourceType = chalk.bold(typeName);
      const name = matches.bestMatch.target.typeId;

      Logger.log('');
      Logger.log(`${prefix} ${sourceType}`);
      Logger.log(printResult(name, matches.bestMatch.rating));

      for (const match of matches.ratings) {
        Logger.log(printResult(match.target.typeId, match.rating));
      }
    }
  }

  if (shouldWrite) {
    if (typeof writePath !== 'string') {
      throw new Error(`--write is not valid file path: ${writePath}`);
    }

    const absPath = ensureAbsolute(writePath);
    const ext = extname(absPath).replace('.', '').toLocaleLowerCase();

    let output: string | undefined = undefined;
    const results = transformMap(similarMap);

    if (ext === 'json') {
      output = outputJSON(results);
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
    name?: string;
    threshold?: number;
    write?: string;
  } & GlobalArgs
>(api => {
  const { loaders } = api;

  return {
    command: 'similar <schema>',
    describe: 'Find similar types in a schema',
    builder(yargs) {
      return yargs
        .positional('schema', {
          describe: 'Point to a schema',
          type: 'string',
          demandOption: true,
        })
        .options({
          n: {
            alias: 'name',
            describe: 'Name of a type',
            type: 'string',
          },
          t: {
            alias: 'threshold',
            describe: 'Threshold of similarity ratio',
            type: 'number',
          },
          w: {
            alias: 'write',
            describe: 'Write a file with stats',
            type: 'string',
          },
        });
    },
    async handler(args) {
      const { headers, token } = parseGlobalArgs(args);
      const writePath = args.write;
      const type = args.name;
      const threshold = args.threshold;
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

      return handler({ schema, writePath, type, threshold });
    },
  };
});

function indent(line: string, space: number): string {
  return line.padStart(line.length + space, ' ');
}

interface SimilarRecord {
  typename: string;
  rating: number;
}

interface SimilarResults {
  [typename: string]: SimilarRecord[];
}

function transformMap(similarMap: SimilarMap): SimilarResults {
  const results: SimilarResults = {};

  for (const typename in similarMap) {
    if (Object.prototype.hasOwnProperty.call(similarMap, typename)) {
      const result = similarMap[typename];

      results[typename] = [];

      if (result.bestMatch) {
        results[typename].push(trasformResult(result.bestMatch));
      }

      if (result.ratings) {
        results[typename].push(...result.ratings.map(trasformResult));
      }
    }
  }

  return results;
}

function trasformResult(record: Rating): SimilarRecord {
  return {
    typename: record.target.typeId,
    rating: record.rating,
  };
}

function outputJSON(results: SimilarResults): string {
  return JSON.stringify(results);
}

function printResult(name: string, rating: number): string {
  const percentage = chalk.grey(`(${formatRating(rating)}%)`);

  return indent(`${printScale(rating)} ${percentage} ${name}`, 0);
}

function printScale(ratio: number): string {
  const percentage = Math.floor(ratio * 100);
  const levels = [0, 30, 50, 70, 90];

  return levels
    .map(level => percentage >= level)
    .map(enabled => (enabled ? figures.bullet : chalk.gray(figures.bullet)))
    .join('');
}

function formatRating(ratio: number): number {
  return Math.floor(ratio * 100);
}
