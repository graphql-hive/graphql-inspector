import { expectDiffAndPatchToMatch } from './utils.js';

describe('fields', () => {
  test('fieldTypeChanged', async () => {
    const before = /* GraphQL */ `
      type Product {
        id: ID!
      }
    `;
    const after = /* GraphQL */ `
      type Product {
        id: String!
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldRemoved', async () => {
    const before = /* GraphQL */ `
      type Product {
        id: ID!
        name: String
      }
    `;
    const after = /* GraphQL */ `
      type Product {
        id: ID!
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldAdded', async () => {
    const before = /* GraphQL */ `
      type Product {
        id: ID!
      }
    `;
    const after = /* GraphQL */ `
      type Product {
        id: ID!
        name: String
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldAdded to new type', async () => {
    const before = /* GraphQL */ `
      scalar Foo
    `;
    const after = /* GraphQL */ `
      scalar Foo
      type Product {
        id: ID!
        name: String
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldArgumentAdded', async () => {
    const before = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession
      }
    `;
    const after = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat(firstMessage: String): ChatSession
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldArgumentTypeChanged', async () => {
    const before = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat(id: String): ChatSession
      }
    `;
    const after = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat(id: ID!): ChatSession
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldArgumentDescriptionChanged', async () => {
    const before = /* GraphQL */ `
      scalar ChatSession
      type Query {
        """
        The first is the worst
        """
        chat(firstMessage: String): ChatSession
      }
    `;
    const after = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat(
          """
          Second is best
          """
          firstMessage: String
        ): ChatSession
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldDeprecationReasonAdded', async () => {
    const before = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession @deprecated
      }
    `;
    const after = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession @deprecated(reason: "Use Query.initiateChat")
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldDeprecationAdded', async () => {
    const before = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession
      }
    `;
    const after = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession @deprecated
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldDeprecationAdded: with reason', async () => {
    const before = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession
      }
    `;
    const after = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession @deprecated(reason: "Because no one chats anymore")
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldDeprecationRemoved', async () => {
    const before = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession @deprecated
      }
    `;
    const after = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldDescriptionAdded', async () => {
    const before = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession
      }
    `;
    const after = /* GraphQL */ `
      scalar ChatSession
      type Query {
        """
        Talk to a person
        """
        chat: ChatSession
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldDescriptionChanged', async () => {
    const before = /* GraphQL */ `
      scalar ChatSession
      type Query {
        """
        Talk to a person
        """
        chat: ChatSession
      }
    `;
    const after = /* GraphQL */ `
      scalar ChatSession
      type Query {
        """
        Talk to a robot
        """
        chat: ChatSession
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('fieldDescriptionRemoved', async () => {
    const before = /* GraphQL */ `
      scalar ChatSession
      type Query {
        """
        Talk to a person
        """
        chat: ChatSession
      }
    `;
    const after = /* GraphQL */ `
      scalar ChatSession
      type Query {
        chat: ChatSession
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });
});
