import { buildSchema, parse, print, Source } from 'graphql';
import { validate } from '../src/index.js';

describe('validate', () => {
  test('basic', () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String @deprecated(reason: "BECAUSE")
        author: String
        createdAt: Int
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const doc = parse(/* GraphQL */ `
      query getPost {
        post {
          id
          title
        }
      }
    `);

    const results = validate(schema, [new Source(print(doc))]);

    expect(results.length).toEqual(1);
    expect(results[0].errors.length).toEqual(0);
    expect(results[0].deprecated.length).toEqual(1);

    const deprecated = results[0].deprecated[0];
    expect(deprecated.message).toMatch(`The field 'Post.title' is deprecated. BECAUSE`);
  });

  test('multiple fragments across multiple files with nested fragments (#36)', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String @deprecated(reason: "BECAUSE")
        author: User
        createdAt: Int
      }

      type User {
        id: ID
        name: String
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        query getPost {
          post {
            ...PostInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          author {
            ...AuthorInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment AuthorInfo on User {
          id
          name
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
    );

    expect(results.length).toEqual(0);
  });

  test('pass when a string value contains "..."', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Mutation {
        createItems(input: [ItemInput!]!): CreateItemsPayload
      }

      type CreateItemsPayload {
        info(format: String): CreateItemsInfo
      }

      type CreateItemsInfo {
        nodesCreated: Int
      }

      input ItemInput {
        name: String
        description: String
      }

      type Query {
        _: Boolean
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        mutation createItems {
          createItems(input: [{ name: "Test", description: "Test...Test" }]) {
            info {
              nodesCreated
            }
            ...CreateItemsInfo
          }
        }

        fragment CreateItemsInfo on CreateItemsPayload {
          info {
            nodesCreated
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment CreateItemsDescription on CreateItemsPayload {
          info(format: "Test...Test") {
            nodesCreated
          }
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
    );

    expect(results.length).toEqual(0);
  });

  test('fail on non unique fragment names', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String
        createdAt: Int
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        query getPost {
          post {
            ...PostInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          title
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          title
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
    );

    expect(results.length).toEqual(1);
    expect(results[0].errors.length).toEqual(1);
    expect(results[0].deprecated.length).toEqual(0);

    const error = results[0].errors[0];

    expect(error.message).toMatch(`Name of 'PostInfo' fragment is not unique`);
  });

  test('omit unused fragment from a document', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String
        createdAt: Int
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        query getPost {
          post {
            ...PostInfo
          }
        }

        fragment UnusedPost on Post {
          id
          createdAt
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          title
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
    );

    expect(results.length).toEqual(0);
  });

  test('fail when exceeded max query depth (inline fragment)', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String
        createdAt: Int
        author: User
      }

      type User {
        id: ID
        name: String
        posts: [Post]
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        query getPost {
          post {
            ...PostInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          author {
            ... on User {
              id
            }
          }
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
      {
        maxDepth: 1,
      },
    );

    expect(results.length).toEqual(1);
  });

  test('fail when exceeded max query depth (spread fragments)', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String
        createdAt: Int
        author: User
      }

      type User {
        id: ID
        name: String
        posts: [Post]
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        query getPost {
          post {
            ...PostInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          title
          author {
            ...UserInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment UserInfo on User {
          id
          name
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
      {
        maxDepth: 1,
      },
    );

    expect(results.length).toEqual(1);
  });

  test('pass when not exceeded max query depth', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String
        createdAt: Int
        author: User
      }

      type User {
        id: ID
        name: String
        posts: [Post]
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        query getPost {
          post {
            ...PostInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          author {
            ...UserInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment UserInfo on User {
          id
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
      {
        maxDepth: 2,
      },
    );

    expect(results.length).toEqual(0);
  });

  test('deprecated notice for query arguments', () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String
        author: String
        createdAt: Int
      }

      input PostQuery {
        title: String
      }

      input LegacyPostQuery {
        text: String
      }

      type Query {
        findPost(
          searchQuery: PostQuery
          query: LegacyPostQuery @deprecated(reason: "Please use 'searchQuery' instead.")
        ): Post
      }

      schema {
        query: Query
      }
    `);

    const doc = parse(/* GraphQL */ `
      query getPost {
        findPost(query: { text: "title" }) {
          id
        }
      }
    `);

    const results = validate(schema, [new Source(print(doc))]);

    expect(results.length).toEqual(1);
    expect(results[0].errors.length).toEqual(0);
    expect(results[0].deprecated.length).toEqual(1);

    const deprecated = results[0].deprecated[0];
    expect(deprecated.message).toMatch(
      `The argument 'query' of 'findPost' is deprecated. Please use 'searchQuery' instead.`,
    );
  });

  test('deprecated notice for field on fragment in different file', () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String @deprecated(reason: "BECAUSE")
        author: String
        createdAt: Int
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        query getPostOrImage {
          post {
            ...PostInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          title
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
    );

    expect(results.length).toEqual(1);
    expect(results[0].errors.length).toEqual(0);
    expect(results[0].deprecated.length).toEqual(1);

    const deprecated = results[0].deprecated[0];
    expect(deprecated.message).toMatch(`The field 'Post.title' is deprecated. BECAUSE`);
  });

  test('pass when not exceeded max complexity score', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String
        createdAt: Int
        author: User
      }

      type User {
        id: ID
        name: String
        posts: [Post]
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        query getPost {
          post {
            ...PostInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          author {
            ...UserInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment UserInfo on User {
          id
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
      {
        validateComplexityConfig: {
          maxComplexityScore: 100,
          complexityScalarCost: 1,
          complexityObjectCost: 2,
          complexityDepthCostFactor: 1.5,
        },
      },
    );

    expect(results.length).toEqual(0);
  });

  test('fail when exceeded max complexity score (inline fragment)', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String
        createdAt: Int
        author: User
      }

      type User {
        id: ID
        name: String
        posts: [Post]
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        query getPost {
          post {
            ...PostInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          author {
            ... on User {
              id
            }
          }
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
      {
        validateComplexityConfig: {
          maxComplexityScore: 50,
          complexityScalarCost: 1,
          complexityObjectCost: 2,
          complexityDepthCostFactor: 1.5,
        },
      },
    );

    expect(results.length).toEqual(1);
  });

  test('fail when exceeded max complexity score (spread fragments)', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Post {
        id: ID
        title: String
        createdAt: Int
        author: User
      }

      type User {
        id: ID
        name: String
        posts: [Post]
      }

      type Query {
        post: Post
      }

      schema {
        query: Query
      }
    `);

    const docs = [
      parse(/* GraphQL */ `
        query getPost {
          post {
            ...PostInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment PostInfo on Post {
          id
          title
          author {
            ...UserInfo
          }
        }
      `),
      parse(/* GraphQL */ `
        fragment UserInfo on User {
          id
          name
        }
      `),
    ];

    const results = validate(
      schema,
      docs.map(doc => new Source(print(doc))),
      {
        validateComplexityConfig: {
          maxComplexityScore: 50,
          complexityScalarCost: 1,
          complexityObjectCost: 2,
          complexityDepthCostFactor: 1.5,
        },
      },
    );

    expect(results.length).toEqual(1);
  });
});
