import { expectPatchToMatch } from './utils.js';

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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
  });
});
