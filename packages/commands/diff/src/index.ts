import {
  createCommand,
  ensureAbsolute,
  parseGlobalArgs,
  GlobalArgs,
} from '@graphql-inspector/commands';
import {symbols, Logger, bolderize} from '@graphql-inspector/logger';
import {
  diff as diffSchema,
  CriticalityLevel,
  Change,
  DiffRule,
  Rule,
  CompletionHandler,
  CompletionArgs,
} from '@graphql-inspector/core';
import {existsSync} from 'fs';

export default createCommand<
  {},
  {
    oldSchema: string;
    newSchema: string;
    rule?: string[];
    onComplete?: string;
  } & GlobalArgs
>((api) => {
  const {loaders} = api;

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
            alias: 'rule',
            describe: 'Add rules',
            array: true,
          },
          onComplete: {
            alias: 'onComplete',
            describe: 'Handle Completion',
            type: 'string'
          },
        });
    },
    async handler(args) {
      try {
        const oldSchemaPointer = args.oldSchema;
        const newSchemaPointer = args.newSchema;
        const {headers, token} = parseGlobalArgs(args);

        const oldSchema = await loaders.loadSchema(oldSchemaPointer, {
          headers,
          token,
        });
        const newSchema = await loaders.loadSchema(newSchemaPointer, {
          headers,
          token,
        });

        const onComplete = args.onComplete ? resolveCompletionHandler(args.onComplete) : failOnBreakingChanges

        const rules = args.rule
          ? args.rule
              .map(
                (name): Rule => {
                  const rule = resolveRule(name);

                  if (!rule) {
                    throw new Error(`\Rule '${name}' does not exist!\n`);
                  }

                  return rule;
                },
              )
              .filter((f) => f)
          : [];

        const changes = diffSchema(oldSchema, newSchema, rules);

        if (changes.length === 0) {
          Logger.success('No changes detected');
          return;
        }

        Logger.log(
          `\nDetected the following changes (${changes.length}) between schemas:\n`,
        );

        const breakingChanges = changes.filter(
          (change) => change.criticality.level === CriticalityLevel.Breaking,
        );
        const dangerousChanges = changes.filter(
          (change) => change.criticality.level === CriticalityLevel.Dangerous,
        );
        const nonBreakingChanges = changes.filter(
          (change) => change.criticality.level === CriticalityLevel.NonBreaking,
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
        
        onComplete({ breakingChanges, dangerousChanges, nonBreakingChanges })
      } catch (error) {
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

  sorted.forEach((change) => {
    Logger.log(`${label}  ${bolderize(change.message)}`);
  });
}

function reportDangerousChanges(changes: Change[]) {
  const label = symbols.warning;
  const sorted = sortChanges(changes);

  sorted.forEach((change) => {
    Logger.log(`${label}  ${bolderize(change.message)}`);
  });
}

function reportNonBreakingChanges(changes: Change[]) {
  const label = symbols.success;
  const sorted = sortChanges(changes);

  sorted.forEach((change) => {
    Logger.log(`${label}  ${bolderize(change.message)}`);
  });
}

function resolveRule(name: string): Rule | undefined {
  const filepath = ensureAbsolute(name);
  if (existsSync(filepath)) {
    return require(filepath);
  }

  return DiffRule[name as keyof typeof DiffRule];
}

function resolveCompletionHandler(name: string): CompletionHandler | undefined {
  const filepath = ensureAbsolute(name);
  if (existsSync(filepath)) {
    return require(filepath);
  }
  throw new Error(`CompletionHandler '${name}' does not exist!`)
}

function failOnBreakingChanges({ breakingChanges }: CompletionArgs) {
  const breakingCount = breakingChanges.length;

  if (breakingCount) {
    Logger.error(
      `Detected ${breakingCount} breaking change${
        breakingCount > 1 ? 's' : ''
      }`,
    );
    process.exit(1);
  } else {
    Logger.success('No breaking changes detected');
  }
}
