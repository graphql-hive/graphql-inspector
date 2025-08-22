import { expectPatchToMatch } from './utils.js';

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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
  })

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
    await expectPatchToMatch(before, after);
  });
});
