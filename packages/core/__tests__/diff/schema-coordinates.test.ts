import { buildSchema } from 'graphql';
import { diff } from '../../src/index.js';

describe('schema coordinates in change messages', () => {
  test('object field added', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      type Product {
        id: ID
      }
      type Query {
        product: Product
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      type Product {
        id: ID
        name: String
      }
      type Query {
        product: Product
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(change => change.type === 'FIELD_ADDED');
    expect(change?.message).toEqual(`Object field 'Product.name' was added`);
  });

  test('interface field removed', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      interface Node {
        id: ID
        old: String
      }
      type Query {
        node: Node
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      interface Node {
        id: ID
      }
      type Query {
        node: Node
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(change => change.type === 'FIELD_REMOVED');
    expect(change?.message).toEqual(`Interface field 'Node.old' was removed`);
  });

  test('field argument added', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      type Query {
        product: String
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      type Query {
        product(id: ID!): String
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(change => change.type === 'FIELD_ARGUMENT_ADDED');
    expect(change?.message).toEqual(`Argument 'Query.product(id:)' of type 'ID!' was added`);
  });

  test('field argument type changed', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      type Query {
        product(id: ID): String
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      type Query {
        product(id: ID!): String
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(change => change.type === 'FIELD_ARGUMENT_TYPE_CHANGED');
    expect(change?.message).toEqual(
      `Argument 'Query.product(id:)' changed type from 'ID' to 'ID!'`,
    );
  });

  test('input field removed', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      input Filter {
        x: String
        y: String
      }
      type Query {
        search(filter: Filter): String
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      input Filter {
        y: String
      }
      type Query {
        search(filter: Filter): String
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(change => change.type === 'INPUT_FIELD_REMOVED');
    expect(change?.message).toEqual(`Input field 'Filter.x' was removed`);
  });

  test('enum value added', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      enum Color {
        BLUE
      }
      type Query {
        color: Color
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      enum Color {
        BLUE
        RED
      }
      type Query {
        color: Color
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(change => change.type === 'ENUM_VALUE_ADDED');
    expect(change?.message).toEqual(`Enum value 'Color.RED' was added`);
  });

  test('directive added', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      type Query {
        id: ID
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      directive @feature on FIELD_DEFINITION
      type Query {
        id: ID
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(change => change.type === 'DIRECTIVE_ADDED');
    expect(change?.message).toEqual(`Directive '@feature' was added`);
  });

  test('directive argument added', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      directive @feature on FIELD_DEFINITION
      type Query {
        id: ID
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      directive @feature(name: String) on FIELD_DEFINITION
      type Query {
        id: ID
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(change => change.type === 'DIRECTIVE_ARGUMENT_ADDED');
    expect(change?.message).toEqual(`Argument '@feature(name:)' was added`);
  });

  test('directive usage added to field', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      directive @shareable on FIELD_DEFINITION
      type Product {
        name: String
      }
      type Query {
        product: Product
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      directive @shareable on FIELD_DEFINITION
      type Product {
        name: String @shareable
      }
      type Query {
        product: Product
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(change => change.type === 'DIRECTIVE_USAGE_FIELD_DEFINITION_ADDED');
    expect(change?.message).toEqual(`Directive '@shareable' was added to field 'Product.name'`);
  });

  test('directive usage added to argument', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      directive @tag on ARGUMENT_DEFINITION
      type Query {
        product(id: ID): String
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      directive @tag on ARGUMENT_DEFINITION
      type Query {
        product(id: ID @tag): String
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(
      change => change.type === 'DIRECTIVE_USAGE_ARGUMENT_DEFINITION_ADDED',
    );
    expect(change?.message).toEqual(`Directive '@tag' was added to argument 'Query.product(id:)'`);
  });

  test('directive usage added to union', async () => {
    const oldSchema = buildSchema(/* GraphQL */ `
      directive @tag on UNION
      type Product {
        id: ID
      }
      union SearchResult = Product
      type Query {
        search: SearchResult
      }
    `);
    const newSchema = buildSchema(/* GraphQL */ `
      directive @tag on UNION
      type Product {
        id: ID
      }
      union SearchResult @tag = Product
      type Query {
        search: SearchResult
      }
    `);
    const changes = await diff(oldSchema, newSchema);
    const change = changes.find(change => change.type === 'DIRECTIVE_USAGE_UNION_MEMBER_ADDED');
    expect(change?.message).toEqual(`Directive '@tag' was added to union 'SearchResult'`);
  });
});
