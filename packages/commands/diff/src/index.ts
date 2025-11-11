import { existsSync } from 'fs';
import { GraphQLSchema } from 'graphql';
import {
  CommandFactory,
  createCommand,
  ensureAbsolute,
  GlobalArgs,
  parseGlobalArgs,
} from '@graphql-inspector/commands';
import {
  Change,
  CompletionArgs,
  CompletionHandler,
  CriticalityLevel,
  DiffRule,
  diff as diffSchema,
  Rule,
  UsageHandler,
} from '@graphql-inspector/core';
import { bolderize, Logger, symbols } from '@graphql-inspector/logger';

export { CommandFactory };

export async function handler(input: {
  oldSchema: GraphQLSchema;
  newSchema: GraphQLSchema;
  onComplete?: string;
  onUsage?: string;
  rules?: Array<string | number>;
}) {
  const onComplete = input.onComplete
    ? resolveCompletionHandler(input.onComplete)
    : failOnBreakingChanges;

  let verboseChanges = false;
  const rules = await Promise.all(
    [...(input.rules ?? [])]
      .filter(isString)
      .map(async (name): Promise<Rule> | undefined => {
        if (name === 'verboseChanges') {
          verboseChanges = true;
          return;
        }

        const rule = await resolveRule(name);

        if (!rule) {
          throw new Error(`Rule '${name}' does not exist!\n`);
        }

        return rule;
      })
      .filter((f): f is NonNullable<typeof f> => !!f)
  );
  if (!verboseChanges) {
    rules.push(DiffRule.simplifyChanges);
  }

  const changes = await diffSchema(input.oldSchema, input.newSchema, rules, {
    checkUsage: input.onUsage ? resolveUsageHandler(input.onUsage) : undefined,
  });

  if (changes.length === 0) {
    Logger.success('No changes detected');
    return;
  }

  Logger.log(`\nDetected the following changes (${changes.length}) between schemas:\n`);

  const breakingChanges = changes.filter(
    change => change.criticality.level === CriticalityLevel.Breaking,
  );
  const dangerousChanges = changes.filter(
    change => change.criticality.level === CriticalityLevel.Dangerous,
  );
  const nonBreakingChanges = changes.filter(
    change => change.criticality.level === CriticalityLevel.NonBreaking,
  );

  if (breakingChanges.length) {
    reportBreakingChanges(breakingChanges);
  }

  if (dangerousChanges.length) {
    reportDangerousChanges(dangerousChanges);
  }

  if (nonBreakingChanges.length) {
    reportNonBreakingChanges(nonBreakingChanges);
  }

  onComplete({ breakingChanges, dangerousChanges, nonBreakingChanges });
}

export default createCommand<
  {},
  {
    oldSchema: string;
    newSchema: string;
    rule?: Array<string | number>;
    onComplete?: string;
    onUsage?: string;
  } & GlobalArgs
>(api => {
  const { loaders } = api;

  return {
    command: 'diff <oldSchema> <newSchema>',
    describe: 'Compare two GraphQL Schemas',
    builder(yargs) {
      return yargs
        .positional('oldSchema', {
          describe: 'Point to an old schema',
          type: 'string',
          demandOption: true,
        })
        .positional('newSchema', {
          describe: 'Point to a new schema',
          type: 'string',
          demandOption: true,
        })
        .options({
          rule: {
            describe: 'Add rules',
            array: true,
          },
          onComplete: {
            describe: 'Handle Completion',
            type: 'string',
          },
          onUsage: {
            describe: 'Checks usage of schema',
            type: 'string',
          },
        });
    },
    async handler(args) {
      try {
        const oldSchemaPointer = args.oldSchema;
        const newSchemaPointer = args.newSchema;
        const apolloFederation = args.federation || false;
        const apolloFederationV2 = args.federationV2 || false;
        const aws = args.aws || false;
        const method = args.method?.toUpperCase() || 'POST';
        const { headers, leftHeaders, rightHeaders, token } = parseGlobalArgs(args);

        const oldSchemaHeaders = {
          ...headers,
          ...leftHeaders,
        };
        const newSchemaHeaders = {
          ...headers,
          ...rightHeaders,
        };

        const oldSchema = await loaders.loadSchema(
          oldSchemaPointer,
          {
            headers: oldSchemaHeaders,
            token,
            method,
          },
          apolloFederation,
          apolloFederationV2,
          aws,
        );
        const newSchema = await loaders.loadSchema(
          newSchemaPointer,
          {
            headers: newSchemaHeaders,
            token,
            method,
          },
          apolloFederation,
          apolloFederationV2,
          aws,
        );

        await handler({
          oldSchema,
          newSchema,
          rules: args.rule,
          onComplete: args.onComplete,
          onUsage: args.onUsage,
        });
      } catch (error: any) {
        Logger.error(error);
        throw error;
      }
    },
  };
});

function sortChanges(changes: Change[]) {
  return changes.slice().sort((a, b) => {
    const aPath = a.path || '';
    const bPath = b.path || '';

    if (aPath > bPath) {
      return 1;
    }

    if (bPath > aPath) {
      return -1;
    }

    return 0;
  });
}

function reportBreakingChanges(changes: Change[]) {
  const label = symbols.error;
  const sorted = sortChanges(changes);

  for (const change of sorted) {
    Logger.log(`${label}  ${bolderize(change.message)}`);
  }
}

function reportDangerousChanges(changes: Change[]) {
  const label = symbols.warning;
  const sorted = sortChanges(changes);

  for (const change of sorted) {
    Logger.log(`${label}  ${bolderize(change.message)}`);
  }
}

function reportNonBreakingChanges(changes: Change[]) {
  const label = symbols.success;
  const sorted = sortChanges(changes);

  for (const change of sorted) {
    Logger.log(`${label}  ${bolderize(change.message)}`);
  }
}

async function resolveRule(name: string): Promise<Rule | undefined> {
  const filepath = ensureAbsolute(name);
  if (existsSync(filepath)) {
    return (await import(filepath)).default;
  }

  return DiffRule[name as keyof typeof DiffRule];
}

function resolveCompletionHandler(name: string): CompletionHandler | never {
  const filepath = ensureAbsolute(name);

  try {
    require.resolve(filepath);
  } catch (error) {
    throw new Error(`CompletionHandler '${name}' does not exist!`);
  }

  const mod = require(filepath);

  return mod?.default || mod;
}

function resolveUsageHandler(name: string): UsageHandler | never {
  const filepath = ensureAbsolute(name);

  try {
    require.resolve(filepath);
  } catch (error) {
    throw new Error(`UsageHandler '${name}' does not exist!`);
  }
  const mod = require(filepath);

  return mod?.default || mod;
}

function failOnBreakingChanges({ breakingChanges }: CompletionArgs) {
  const breakingCount = breakingChanges.length;

  if (breakingCount) {
    Logger.error(`Detected ${breakingCount} breaking change${breakingCount > 1 ? 's' : ''}`);
    process.exit(1);
  } else {
    Logger.success('No breaking changes detected');
  }
}

function isString(val: any): val is string {
  return typeof val === 'string';
}
