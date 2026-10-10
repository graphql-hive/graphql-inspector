import { buildSchema, GraphQLObjectType } from 'graphql';
import { mockGraphQLServer } from '@graphql-inspector/testing';
import loader from '../src/index.js';

test('should contain descriptions', async () => {
  const schema = buildSchema(/* GraphQL */ `
    """
    User type it is
    """
    type User {
      """
      User of ID, of course
      """
      id: ID!
    }

    type Query {
      """
      Get User by ID
      """
      user(id: ID!): User
    }
  `);

  const done = mockGraphQLServer({
    schema,
    host: 'http://localhost',
    path: '/graphql',
  });

  const introspectedSchema = await loader.load('http://localhost/graphql', {});

  const user = introspectedSchema[0].schema!.getType('User') as GraphQLObjectType;

  // User
  expect(user.description).toBe('User type it is');
  // User.id
  expect(user.getFields().id.description).toBe('User of ID, of course');
  // Query.user
  expect(schema.getQueryType()!.getFields().user.description).toBe('Get User by ID');

  done();
});

test('use GET method', async () => {
  const schema = buildSchema(/* GraphQL */ `
    """
    User type it is
    """
    type User {
      """
      User of ID, of course
      """
      id: ID!
    }

    type Query {
      """
      Get User by ID
      """
      user(id: ID!): User
    }
  `);

  const done = mockGraphQLServer({
    schema,
    host: 'http://localhost',
    path: '/graphql',
    method: 'GET',
  });

  const introspectedSchema = await loader.load('http://localhost/graphql', {
    method: 'GET',
  });

  const user = introspectedSchema[0].schema!.getType('User') as GraphQLObjectType;

  // User
  expect(user.description).toBe('User type it is');
  // User.id
  expect(user.getFields().id.description).toBe('User of ID, of course');
  // Query.user
  expect(schema.getQueryType()!.getFields().user.description).toBe('Get User by ID');

  done();
});
