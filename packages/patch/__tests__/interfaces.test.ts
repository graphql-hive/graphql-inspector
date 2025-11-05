import {
  expectDiffAndPatchToMatch,
  expectDiffAndPatchToPass,
  expectDiffAndPatchToThrow,
} from './utils.js';

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
    await expectDiffAndPatchToMatch(before, after);
  });

  test('objectTypeInterfaceAdded: passes if already exists', async () => {
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
    await expectDiffAndPatchToPass(before, after, after);
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
    await expectDiffAndPatchToMatch(before, after);
  });

  test('objectTypeInterfaceRemoved: passes if interface is not applied to type', async () => {
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
    await expectDiffAndPatchToPass(before, after, after);
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
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldAdded: passes if field already added', async () => {
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
    await expectDiffAndPatchToPass(before, after, after);
  });

  test('fieldAdded: throws if type is non-existent', async () => {
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

    const patchTarget = /* GraphQL */ `
      interface Node {
        id: ID!
        name: String
      }
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
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
    await expectDiffAndPatchToMatch(before, after);
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
    await expectDiffAndPatchToMatch(before, after);
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
    await expectDiffAndPatchToMatch(before, after);
  });
});
