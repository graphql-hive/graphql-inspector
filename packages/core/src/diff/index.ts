import { GraphQLSchema } from 'graphql';
import { Change } from './changes/change.js';
import * as rules from './rules/index.js';
import { Rule } from './rules/types.js';
import { diffSchema } from './schema.js';

export * from './rules/types.js';
export const DiffRule = rules;

export * from './onComplete/types.js';
export type { UsageHandler } from './rules/consider-usage.js';

export function diff(
  oldSchema: GraphQLSchema | null,
  newSchema: GraphQLSchema | null,
  rules: Rule[] = [],
  config?: rules.ConsiderUsageConfig,
): Promise<Change[]> {
  const changes = diffSchema(oldSchema, newSchema);

  return rules.reduce(async (prev, rule) => {
    const prevChanges = await prev;
    return rule({
      changes: prevChanges,
      oldSchema,
      newSchema,
      config,
    });
  }, Promise.resolve(changes));
}
