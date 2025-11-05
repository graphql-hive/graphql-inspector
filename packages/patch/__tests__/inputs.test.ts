import {
  expectDiffAndPatchToMatch,
  expectDiffAndPatchToPass,
  expectDiffAndPatchToThrow,
} from './utils.js';

describe('inputs', () => {
  test('inputFieldAdded', async () => {
    const before = /* GraphQL */ `
      input FooInput {
        id: ID!
      }
    `;
    const after = /* GraphQL */ `
      input FooInput {
        id: ID!
        other: String
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('inputFieldAdded: field added to new input', async () => {
    const before = /* GraphQL */ `
      scalar Foo
    `;
    const after = /* GraphQL */ `
      scalar Foo
      input FooInput {
        id: ID!
        other: String
      }
      type Query {
        foo(foo: FooInput): Foo
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('inputFieldAdded: passes if input already exists', async () => {
    const before = /* GraphQL */ `
      scalar Foo
    `;
    const after = /* GraphQL */ `
      scalar Foo
      input FooInput {
        id: ID!
        other: String
      }
      type Query {
        foo(foo: FooInput): Foo
      }
    `;
    const patchTarget = /* GraphQL */ `
      scalar Foo
      input FooInput {
        id: ID!
        other: String
      }
    `;
    await expectDiffAndPatchToPass(before, after, patchTarget);
  });

  test('inputFieldRemoved', async () => {
    const before = /* GraphQL */ `
      input FooInput {
        id: ID!
        other: String
      }
    `;
    const after = /* GraphQL */ `
      input FooInput {
        id: ID!
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('inputFieldRemoved: passes for non-existent field', async () => {
    const before = /* GraphQL */ `
      input FooInput {
        id: ID!
        other: String
      }
    `;
    const after = /* GraphQL */ `
      input FooInput {
        id: ID!
      }
    `;
    const patchTarget = /* GraphQL */ `
      scalar Foo
    `;
    await expectDiffAndPatchToPass(before, after, patchTarget);
  });

  test('inputFieldDescriptionAdded', async () => {
    const before = /* GraphQL */ `
      input FooInput {
        id: ID!
      }
    `;
    const after = /* GraphQL */ `
      """
      After
      """
      input FooInput {
        id: ID!
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('inputFieldDescriptionAdded: errors for non-existent field', async () => {
    const before = /* GraphQL */ `
      input FooInput {
        id: ID!
      }
    `;
    const after = /* GraphQL */ `
      """
      After
      """
      input FooInput {
        id: ID!
      }
    `;
    const patchTarget = /* GraphQL */ `
      scalar Foo
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
  });

  test('inputFieldTypeChanged', async () => {
    const before = /* GraphQL */ `
      input FooInput {
        id: ID!
      }
    `;
    const after = /* GraphQL */ `
      input FooInput {
        id: ID
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('inputFieldTypeChanged: errors for non-existent input', async () => {
    const before = /* GraphQL */ `
      input FooInput {
        id: ID!
      }
    `;
    const after = /* GraphQL */ `
      input FooInput {
        id: ID
      }
    `;
    const patchTarget = /* GraphQL */ `
      scalar Foo
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
  });

  test('inputFieldDescriptionRemoved', async () => {
    const before = /* GraphQL */ `
      """
      Before
      """
      input FooInput {
        id: ID!
      }
    `;
    const after = /* GraphQL */ `
      input FooInput {
        id: ID!
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('inputFieldDescriptionRemoved: passes for non-existent input', async () => {
    const before = /* GraphQL */ `
      """
      Before
      """
      input FooInput {
        id: ID!
      }
    `;
    const after = /* GraphQL */ `
      input FooInput {
        id: ID!
      }
    `;
    const patchTarget = /* GraphQL */ `
      scalar Foo
    `;
    await expectDiffAndPatchToPass(before, after, patchTarget);
  });
});
