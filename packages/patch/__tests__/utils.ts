import {
  buildASTSchema,
  buildSchema,
  GraphQLSchema,
  lexicographicSortSchema,
  parse,
} from 'graphql';
import { Change, diff } from '@graphql-inspector/core';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { errors, patch } from '../src/index.js';

function printSortedSchema(schema: GraphQLSchema) {
  return printSchemaWithDirectives(lexicographicSortSchema(schema));
}

async function buildDiffPatch(before: string, after: string, patchTarget: string = before) {
  const schemaA = buildSchema(before, { assumeValid: true, assumeValidSDL: true });
  const schemaB = buildSchema(after, { assumeValid: true, assumeValidSDL: true });

  const changes = await diff(schemaA, schemaB);
  const patched = patch(parse(patchTarget), changes, {
    debug: process.env.DEBUG === 'true',
    onError: errors.strictErrorHandler,
  });
  return buildASTSchema(patched, { assumeValid: true, assumeValidSDL: true });
}

export async function expectDiffAndPatchToMatch(
  before: string,
  after: string,
): Promise<GraphQLSchema> {
  const patched = await buildDiffPatch(before, after);
  expect(printSortedSchema(patched)).toBe(printSortedSchema(buildSchema(after)));
  return patched;
}

export async function expectDiffAndPatchToThrow(
  before: string,
  after: string,
  /** The schema that gets patched using the diff  */
  patchSchema: string,
): Promise<void> {
  await expect(async () => await buildDiffPatch(before, after, patchSchema)).rejects.toThrow();
}

/**
 * Differs from "expectDiffAndPatchToMatch" because the end result doesn't need to match the "after"
 * argument. Instead, it just needs to not result in an error when patching another schema.
 */
export async function expectDiffAndPatchToPass(
  before: string,
  after: string,
  /** The schema that gets patched using the diff  */
  patchSchema: string,
): Promise<GraphQLSchema> {
  const result = buildDiffPatch(before, after, patchSchema);
  await expect(result).resolves.toBeInstanceOf(GraphQLSchema);
  return result;
}
