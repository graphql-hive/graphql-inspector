import { expectPatchToMatch } from './utils.js';

describe('interfaces', () => {
  test('objectTypeInterfaceAdded', async () => {
    const before = /* GraphQL */ `
      interface Node {
        id: ID!
      }
      type Foo {
        id: ID!
      }
    `;
    const after = /* GraphQL */ `
      interface Node {
        id: ID!
      }
      type Foo implements Node {
        id: ID!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('objectTypeInterfaceRemoved', async () => {
    const before = /* GraphQL */ `
      interface Node {
        id: ID!
      }
      type Foo implements Node {
        id: ID!
      }
    `;

    const after = /* GraphQL */ `
      interface Node {
        id: ID!
      }
      type Foo {
        id: ID!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('fieldAdded', async () => {
    const before = /* GraphQL */ `
      interface Node {
        id: ID!
      }
      type Foo implements Node {
        id: ID!
      }
    `;

    const after = /* GraphQL */ `
      interface Node {
        id: ID!
        name: String
      }
      type Foo implements Node {
        id: ID!
        name: String
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('fieldRemoved', async () => {
    const before = /* GraphQL */ `
      interface Node {
        id: ID!
        name: String
      }
      type Foo implements Node {
        id: ID!
        name: String
      }
    `;

    const after = /* GraphQL */ `
      interface Node {
        id: ID!
      }
      type Foo implements Node {
        id: ID!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageAdded', async () => {
    const before = /* GraphQL */ `
      directive @meta on INTERFACE
      interface Node {
        id: ID!
      }
      type Foo implements Node {
        id: ID!
      }
    `;

    const after = /* GraphQL */ `
      directive @meta on INTERFACE
      interface Node @meta {
        id: ID!
      }
      type Foo implements Node {
        id: ID!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageRemoved', async () => {
    const before = /* GraphQL */ `
      directive @meta on INTERFACE
      interface Node @meta {
        id: ID!
      }
      type Foo implements Node {
        id: ID!
      }
    `;

    const after = /* GraphQL */ `
      directive @meta on INTERFACE
      interface Node {
        id: ID!
      }
      type Foo implements Node {
        id: ID!
      }
    `;
    await expectPatchToMatch(before, after);
  });
});
