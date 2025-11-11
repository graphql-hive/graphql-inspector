import {
  expectDiffAndPatchToMatch,
  expectDiffAndPatchToPass,
  expectDiffAndPatchToThrow,
} from './utils.js';

describe('enum', () => {
  test('typeRemoved', async () => {
    const before = /* GraphQL */ `
      scalar Foo
      enum Status {
        OK
      }
    `;
    const after = /* GraphQL */ `
      scalar Foo
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('typeRemoved: passes if type is non-existent', async () => {
    const before = /* GraphQL */ `
      scalar Foo
      enum Status {
        OK
      }
    `;
    const after = /* GraphQL */ `
      scalar Foo
    `;
    const patchTarget = /* GraphQL */ `
      scalar Foo
    `;
    await expectDiffAndPatchToPass(before, after, patchTarget);
  });

  test('typeAdded', async () => {
    const before = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
      }
    `;
    const after = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
        SUPER_BROKE
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('typeAdded: ignores if already exists', async () => {
    const before = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
      }
    `;
    const after = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
        SUPER_BROKE
      }
    `;
    await expectDiffAndPatchToPass(before, after, after);
  });

  test('typeAdded: patches Mutation', async () => {
    const before = /* GraphQL */ `
      type Query {
        foo: String
      }
    `;
    const after = /* GraphQL */ `
      type Query {
        foo: String
      }

      type Mutation {
        dooFoo: String
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('typeDescriptionChanged: Added', async () => {
    const before = /* GraphQL */ `
      enum Status {
        OK
      }
    `;
    const after = /* GraphQL */ `
      """
      The status of something.
      """
      enum Status {
        OK
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('typeDescriptionChanged: Changed', async () => {
    const before = /* GraphQL */ `
      """
      Before
      """
      enum Status {
        OK
      }
    `;
    const after = /* GraphQL */ `
      """
      After
      """
      enum Status {
        OK
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('typeDescriptionChanged: errors for non-existent types', async () => {
    const before = /* GraphQL */ `
      """
      Before
      """
      enum Status {
        OK
      }
    `;
    const after = /* GraphQL */ `
      """
      After
      """
      enum Status {
        OK
      }
    `;
    const patchTarget = /* GraphQL */ `
      scalar Foo
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
  });

  test('typeDescriptionChanged: Removed', async () => {
    const before = /* GraphQL */ `
      """
      Before
      """
      enum Status {
        OK
      }
    `;
    const after = /* GraphQL */ `
      enum Status {
        OK
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('typeDescriptionChanged: remove ignored for non-existent type', async () => {
    const before = /* GraphQL */ `
      """
      Before
      """
      enum Status {
        OK
      }
    `;
    const after = /* GraphQL */ `
      enum Status {
        OK
      }
    `;
    const patchTarget = /* GraphQL */ `
      scalar Foo
    `;
    await expectDiffAndPatchToPass(before, after, patchTarget);
  });
});
