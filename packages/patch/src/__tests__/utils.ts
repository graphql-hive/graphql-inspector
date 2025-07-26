import { buildSchema, GraphQLSchema, lexicographicSortSchema, parse, print } from 'graphql';
import { Change, diff } from '@graphql-inspector/core';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { patchSchema } from '../index.js';

function printSortedSchema(schema: GraphQLSchema) {
  return printSchemaWithDirectives(lexicographicSortSchema(schema));
}

export async function expectPatchToMatch(before: string, after: string): Promise<Change<any>[]> {
  const schemaA = buildSchema(before, { assumeValid: true, assumeValidSDL: true });
  const schemaB = buildSchema(after, { assumeValid: true, assumeValidSDL: true });

  const changes = await diff(schemaA, schemaB);
  const patched = patchSchema(schemaA, changes, {
    throwOnError: true,
    debug: process.env.DEBUG === 'true',
  });
  expect(printSortedSchema(schemaB)).toBe(printSortedSchema(patched));
  return changes;
}
