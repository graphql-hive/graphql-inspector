import { expectPatchToMatch } from './utils.js';

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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
  });

  test('typeAdded Mutation', async () => {
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
  });
});
