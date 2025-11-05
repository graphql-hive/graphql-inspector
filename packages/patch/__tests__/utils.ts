import { buildSchema, lexicographicSortSchema, type GraphQLSchema } from 'graphql';
import { Change, diff } from '@graphql-inspector/core';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { errors, patchSchema } from '../src/index.js';

function printSortedSchema(schema: GraphQLSchema) {
  return printSchemaWithDirectives(lexicographicSortSchema(schema));
}

export async function expectDiffAndPatchToMatch(
  before: string,
  after: string,
): Promise<Change<any>[]> {
  const schemaA = buildSchema(before, { assumeValid: true, assumeValidSDL: true });
  const schemaB = buildSchema(after, { assumeValid: true, assumeValidSDL: true });

  const changes = await diff(schemaA, schemaB);
  const patched = patchSchema(schemaA, changes, {
    debug: process.env.DEBUG === 'true',
    onError: errors.strictErrorHandler,
  });
  expect(printSortedSchema(patched)).toBe(printSortedSchema(schemaB));
  return changes;
}
