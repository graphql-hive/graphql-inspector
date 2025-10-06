import { parse, print, Source } from 'graphql';
import { LoadersRegistry } from '@graphql-inspector/loaders';
import { validate } from '../../src/index.js';

describe('apollo federation v2', () => {
  test('should accept basic Federation V2 directives', async () => {
    const doc = parse(/* GraphQL */ `
      query getUser {
        user(id: "1") {
          id
          name
          email
          orders {
            id
            total
          }
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        type User @key(fields: "id") {
          id: ID!
          name: String!
          email: String!
          orders: [Order!]! @external
        }

        type Order @key(fields: "id") {
          id: ID!
          total: Float!
          user: User! @external
        }

        type Query {
          user(id: ID!): User
        }
      `,
      {},
      false,
      true,
      false,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });

  test('should accept @shareable directive on fields', async () => {
    const doc = parse(/* GraphQL */ `
      query getProduct {
        product(id: "1") {
          id
          name
          description
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        extend schema
          @link(
            url: "https://specs.apollographql.com/federation/v2.3"
            import: ["@key", "@shareable"]
          )

        type Product @key(fields: "id") {
          id: ID!
          name: String! @shareable
          description: String @shareable
        }

        type Query {
          product(id: ID!): Product
        }
      `,
      {},
      false,
      true,
      false,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });

  test('should accept @requires and @provides directives', async () => {
    const doc = parse(/* GraphQL */ `
      query getUserWithShippingEstimate {
        user(id: "1") {
          id
          shippingEstimate
          cart {
            estimatedDelivery
          }
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        extend schema
          @link(
            url: "https://specs.apollographql.com/federation/v2.3"
            import: ["@key", "@external", "@requires", "@provides"]
          )

        type User @key(fields: "id") {
          id: ID!
          zipCode: String @external
          shippingEstimate: String @requires(fields: "zipCode")
          cart: Cart @provides(fields: "estimatedDelivery")
        }

        type Cart {
          estimatedDelivery: String @external
        }

        type Query {
          user(id: ID!): User
        }
      `,
      {},
      false,
      true,
      false,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });

  test('should accept @override directive', async () => {
    const doc = parse(/* GraphQL */ `
      query getAccount {
        account(id: "1") {
          id
          balance
          currency
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        extend schema
          @link(
            url: "https://specs.apollographql.com/federation/v2.3"
            import: ["@key", "@override"]
          )

        type Account @key(fields: "id") {
          id: ID!
          balance: Float! @override(from: "accounts")
          currency: String!
        }

        type Query {
          account(id: ID!): Account
        }
      `,
      {},
      false,
      true,
      false,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });

  test('should accept @inaccessible directive', async () => {
    const doc = parse(/* GraphQL */ `
      query getUser {
        user(id: "1") {
          id
          name
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        extend schema
          @link(
            url: "https://specs.apollographql.com/federation/v2.3"
            import: ["@key", "@inaccessible"]
          )

        type User @key(fields: "id") {
          id: ID!
          name: String!
          internalId: String @inaccessible
        }

        type Query {
          user(id: ID!): User
        }
      `,
      {},
      false,
      true,
      false,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });

  test('should accept @tag directive', async () => {
    const doc = parse(/* GraphQL */ `
      query getProduct {
        product(id: "1") {
          id
          name
          price
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        extend schema
          @link(url: "https://specs.apollographql.com/federation/v2.3", import: ["@key", "@tag"])

        type Product @key(fields: "id") {
          id: ID!
          name: String!
          price: Float! @tag(name: "pricing")
        }

        type Query {
          product(id: ID!): Product
        }
      `,
      {},
      false,
      true,
      false,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });

  test('should accept @interfaceObject directive', async () => {
    const doc = parse(/* GraphQL */ `
      query getEntity {
        entity(id: "1") {
          id
          name
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        extend schema
          @link(
            url: "https://specs.apollographql.com/federation/v2.3"
            import: ["@key", "@interfaceObject"]
          )

        type Entity @key(fields: "id") @interfaceObject {
          id: ID!
          name: String!
        }

        type Query {
          entity(id: ID!): Entity
        }
      `,
      {},
      false,
      true,
      false,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });

  test('should accept @composeDirective directive', async () => {
    const doc = parse(/* GraphQL */ `
      query getUser {
        user(id: "1") {
          id
          name
          profile
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        extend schema
          @link(
            url: "https://specs.apollographql.com/federation/v2.3"
            import: ["@key", "@composeDirective"]
          )
          @composeDirective(name: "@custom")

        directive @custom(value: String) on FIELD_DEFINITION

        type User @key(fields: "id") {
          id: ID!
          name: String!
          profile: String @custom(value: "user-profile")
        }

        type Query {
          user(id: ID!): User
        }
      `,
      {},
      false,
      true,
      false,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });

  test('should accept complex Federation V2 schema with multiple entities', async () => {
    const doc = parse(/* GraphQL */ `
      query getRecommendations {
        user(id: "1") {
          id
          name
          recommendations {
            id
            name
            price
            reviews {
              id
              rating
              comment
            }
          }
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        extend schema
          @link(
            url: "https://specs.apollographql.com/federation/v2.3"
            import: ["@key", "@external", "@requires", "@provides", "@shareable", "@tag"]
          )

        type User @key(fields: "id") {
          id: ID!
          name: String! @shareable
          age: Int @external
          recommendations: [Product!]!
            @requires(fields: "age")
            @provides(fields: "reviews { rating }")
        }

        type Product @key(fields: "id") {
          id: ID!
          name: String! @shareable
          price: Float! @tag(name: "pricing")
          reviews: [Review!]! @external
        }

        type Review @key(fields: "id") {
          id: ID!
          rating: Int @external
          comment: String
        }

        type Query {
          user(id: ID!): User
        }
      `,
      {},
      false,
      true,
      false,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });

  test('should handle Federation V2 with custom scalar types', async () => {
    const doc = parse(/* GraphQL */ `
      query getEvent {
        event(id: "1") {
          id
          timestamp
          location {
            coordinates
          }
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        extend schema
          @link(
            url: "https://specs.apollographql.com/federation/v2.3"
            import: ["@key", "@shareable"]
          )

        scalar DateTime
        scalar GeoCoordinates

        type Event @key(fields: "id") {
          id: ID!
          timestamp: DateTime! @shareable
          location: Location
        }

        type Location @key(fields: "id") {
          id: ID!
          coordinates: GeoCoordinates!
        }

        type Query {
          event(id: ID!): Event
        }
      `,
      {},
      false,
      true,
      false,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });
});
