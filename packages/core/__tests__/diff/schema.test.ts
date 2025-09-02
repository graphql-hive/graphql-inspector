import { buildClientSchema, buildSchema, introspectionFromSchema } from 'graphql';
import { Change, CriticalityLevel, diff } from '../../src/index.js';
import { findBestMatch } from '../../src/utils/string.js';
import { findChangesByPath, findFirstChangeByPath } from '../../utils/testing.js';

test('same schema', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    type Post {
      id: ID
    }

    type Query {
      fieldA: Post!
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    type Post {
      id: ID
    }

    type Query {
      fieldA: Post!
    }
  `);

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(0);
});

test('renamed query', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    type Query {
      fieldA: String!
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    type RootQuery {
      fieldA: String!
    }

    schema {
      query: RootQuery
    }
  `);

  const changes = await diff(schemaA, schemaB);

  // Type Added
  const added = changes.find(c => c.message.includes('added')) as Change;

  expect(added).toBeDefined();
  expect(added.criticality.level).toEqual(CriticalityLevel.NonBreaking);
  expect(added.message).toEqual(`Type 'RootQuery' was added`);
  expect(added.path).toEqual(`RootQuery`);

  // Type Removed
  const removed = changes.find(c => c.message.includes('removed')) as Change;

  expect(removed).toBeDefined();
  expect(removed.criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(removed.message).toEqual(`Type 'Query' was removed`);
  expect(removed.path).toEqual(`Query`);

  // Root Type Changed
  const changed = changes.find(c => c.message.includes('changed')) as Change;

  expect(changed).toBeDefined();
  expect(changed.criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(changed.message).toEqual(`Schema query root has changed from 'Query' to 'RootQuery'`);
});

test('new field and field changed', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    type Query {
      fieldA: String!
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    type Query {
      fieldA: Int
      fieldB: String
    }
  `);

  const changes = await diff(schemaA, schemaB);
  const changed = changes.find(c => c.message.includes('changed')) as Change;
  const added = changes.find(c => c.message.includes('added')) as Change;

  expect(changed).toBeDefined();
  expect(changed.criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(changed.message).toEqual(`Field 'Query.fieldA' changed type from 'String!' to 'Int'`);
  expect(added).toBeDefined();
  expect(added.criticality.level).toEqual(CriticalityLevel.NonBreaking);
  expect(added.message).toEqual(`Field 'fieldB' was added to object type 'Query'`);
});

test('schema from an introspection result should be the same', async () => {
  const typeDefsA = /* GraphQL */ `
    type Query {
      fieldA: String!
      fieldB: String
    }
  `;
  const schemaA = buildSchema(typeDefsA);
  const schemaB = buildClientSchema(introspectionFromSchema(schemaA));

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(0);
});

test('huge test', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    schema {
      query: Query
    }
    input AInput {
      """
      a
      """
      a: String = "1"
      b: String!
    }
    input ListInput {
      a: [String] = ["foo"]
      b: [String] = ["bar"]
    }
    """
    The Query Root of this schema
    """
    type Query {
      """
      Just a simple string
      """
      a(anArg: String): String!
      b: BType
    }
    type BType {
      a: String
    }
    type CType {
      a: String @deprecated(reason: "whynot")
      c: Int!
      d(arg: Int): String
    }
    union MyUnion = CType | BType
    interface AnInterface {
      interfaceField: Int!
    }
    interface AnotherInterface {
      anotherInterfaceField: String
    }
    type WithInterfaces implements AnInterface & AnotherInterface {
      a: String!
    }
    type WithArguments {
      a(
        """
        Meh
        """
        a: Int
        b: String
      ): String
      b(arg: Int = 1): String
    }
    enum Options {
      A
      B
      C
      E
      F @deprecated(reason: "Old")
    }
    """
    Old
    """
    directive @yolo(
      """
      Included when true.
      """
      someArg: Boolean!
      anotherArg: String!
      willBeRemoved: Boolean!
    ) on FIELD | FRAGMENT_SPREAD | INLINE_FRAGMENT
    type WillBeRemoved {
      a: String
    }
    directive @willBeRemoved on FIELD
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    schema {
      query: Query
    }
    input AInput {
      """
      changed
      """
      a: Int = 1
      c: String!
    }
    input ListInput {
      a: [String] = ["bar"]
      b: [String] = ["bar"]
    }
    """
    Query Root description changed
    """
    type Query {
      """
      This description has been changed
      """
      a: String!
      b: Int!
    }
    input BType {
      a: String!
    }
    type CType implements AnInterface {
      a(arg: Int): String @deprecated(reason: "cuz")
      b: Int!
      d(arg: Int = 10): String
    }
    type DType {
      b: Int!
    }
    union MyUnion = CType | DType
    interface AnInterface {
      interfaceField: Int!
    }
    interface AnotherInterface {
      b: Int
    }
    type WithInterfaces implements AnInterface {
      a: String!
    }
    type WithArguments {
      a(
        """
        Description for a
        """
        a: Int
        b: String!
      ): String
      b(arg: Int = 2): String
    }
    enum Options {
      """
      Stuff
      """
      A
      B
      D
      E @deprecated
      F @deprecated(reason: "New")
    }
    """
    New
    """
    directive @yolo(
      """
      someArg does stuff
      """
      someArg: String!
      anotherArg: String! = "Test"
    ) on FIELD | FIELD_DEFINITION
    directive @yolo2(
      """
      Included when true.
      """
      someArg: String!
    ) on FIELD
  `);

  const changes = await diff(schemaA, schemaB);

  for (const msg of [
    `Type 'WillBeRemoved' was removed`,
    `Type 'DType' was added`,
    `Field 'Query.a' description changed from 'Just a simple string' to 'This description has been changed'`,
    `Argument 'anArg: String' was removed from field 'Query.a'`,
    `Field 'Query.b' changed type from 'BType' to 'Int!'`,
    `Description 'The Query Root of this schema' on type 'Query' has changed to 'Query Root description changed'`,
    `'BType' kind changed from 'ObjectTypeDefinition' to 'InputObjectTypeDefinition'`,
    `Input field 'b' was removed from input object type 'AInput'`,
    `Input field 'c' of type 'String!' was added to input object type 'AInput'`,
    `Input field 'AInput.a' description changed from 'a' to 'changed'`,
    `Input field 'AInput.a' default value changed from '"1"' to '1'`,
    `Input field 'ListInput.a' default value changed from '[ 'foo' ]' to '[ 'bar' ]'`,
    `Input field 'AInput.a' changed type from 'String' to 'Int'`,
    `'CType' object implements 'AnInterface' interface`,
    `Field 'c' was removed from object type 'CType'`,
    `Field 'b' was added to object type 'CType'`,
    `Deprecation reason on field 'CType.a' has changed from 'whynot' to 'cuz'`,
    `Argument 'arg: Int' added to field 'CType.a'`,
    `Default value '10' was added to argument 'arg' on field 'CType.d'`,
    `Member 'BType' was removed from Union type 'MyUnion'`,
    `Member 'DType' was added to Union type 'MyUnion'`,
    `Field 'anotherInterfaceField' was removed from interface 'AnotherInterface'`,
    `Field 'b' was added to interface 'AnotherInterface'`,
    `'WithInterfaces' object type no longer implements 'AnotherInterface' interface`,
    `Description for argument 'a' on field 'WithArguments.a' changed from 'Meh' to 'Description for a'`,
    `Type for argument 'b' on field 'WithArguments.a' changed from 'String' to 'String!'`,
    `Default value for argument 'arg' on field 'WithArguments.b' changed from '1' to '2'`,
    `Enum value 'C' was removed from enum 'Options'`,
    `Enum value 'D' was added to enum 'Options'`,
    `Description 'Stuff' was added to enum value 'Options.A'`,
    `Enum value 'Options.E' was deprecated with reason 'No longer supported'`,
    `Enum value 'Options.F' deprecation reason changed from 'Old' to 'New'`,
    `Directive 'willBeRemoved' was removed`,
    `Directive 'yolo2' was added`,
    `Directive 'yolo' description changed from 'Old' to 'New'`,
    `Location 'FRAGMENT_SPREAD' was removed from directive 'yolo'`,
    `Location 'INLINE_FRAGMENT' was removed from directive 'yolo'`,
    `Location 'FIELD_DEFINITION' was added to directive 'yolo'`,
    `Argument 'willBeRemoved' was removed from directive 'yolo'`,
    `Description for argument 'someArg' on directive 'yolo' changed from 'Included when true.' to 'someArg does stuff'`,
    `Type for argument 'someArg' on directive 'yolo' changed from 'Boolean!' to 'String!'`,
    `Default value '"Test"' was added to argument 'anotherArg' on directive 'yolo'`,
  ]) {
    try {
      expect(changes.some(c => c.message === msg)).toEqual(true);
    } catch (e) {
      console.log(`Couldn't find: ${msg}`);
      const match = findBestMatch(
        msg,
        changes.map(c => ({
          typeId: c.path || '',
          value: c.message,
        })),
      );

      if (match.bestMatch) {
        console.log(`We found a similar change: ${match.bestMatch.target.value}`);
      }

      throw e;
    }
  }

  const expectedPaths = [
    'DType',
    'DType.b',
    'WillBeRemoved',
    'AInput.c',
    'AInput.b',
    'AInput.a',
    'AInput.a',
    'AInput.a',
    'ListInput.a',
    'Query.a',
    'Query.a.anArg',
    'Query.b',
    'Query',
    'BType',
    'CType',
    'CType.b',
    'CType.c',
    'CType.a',
    'CType.a.arg',
    'CType.d.arg',
    'MyUnion',
    'MyUnion',
    'AnotherInterface.b',
    'AnotherInterface.anotherInterfaceField',
    'WithInterfaces',
    'WithArguments.a.a',
    'WithArguments.a.b',
    'WithArguments.b.arg',
    'Options.D',
    'Options.C',
    'Options.A',
    'Options.E.@deprecated',
    'Options.E.@deprecated',
    'Options.F.@deprecated',
    '@yolo2',
    '@yolo2',
    '@yolo2',
    '@willBeRemoved',
    '@yolo',
    '@yolo',
    '@yolo',
    '@yolo',
    '@yolo.willBeRemoved',
    '@yolo.someArg',
    '@yolo.someArg',
    '@yolo.anotherArg',
  ];
  for (const path of expectedPaths) {
    try {
      expect(changes.find(c => c.path === path)?.path).toEqual(path);
    } catch (e) {
      console.log(`Couldn't find: ${path}`);
      throw e;
    }
  }
  // make sure all expected changes are accounted for.
  expect(expectedPaths).toHaveLength(changes.length);
});

test('array as default value in argument (same)', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    interface MyInterface {
      a(b: [String] = ["Hello"]): String!
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    interface MyInterface {
      a(b: [String] = ["Hello"]): String!
    }
  `);

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(0);
});

test('array as default value in argument (different)', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    interface MyInterface {
      a(b: [String] = ["Hello"]): String!
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    interface MyInterface {
      a(b: [String] = ["Goodbye"]): String!
    }
  `);

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(1);
  expect(changes[0]).toBeDefined();
  expect(changes[0].criticality.level).toEqual(CriticalityLevel.Dangerous);
  expect(changes[0].message).toEqual(
    `Default value for argument 'b' on field 'MyInterface.a' changed from '[ 'Hello' ]' to '[ 'Goodbye' ]'`,
  );
  expect(changes[0].path).toEqual(`MyInterface.a.b`);
});

test('input as default value (same)', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    enum SortOrder {
      ASC
    }

    input CommentQuery {
      limit: Int!
      sortOrder: SortOrder!
    }

    type Comment {
      replies(query: CommentQuery = { sortOrder: ASC, limit: 3 }): String!
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    enum SortOrder {
      ASC
    }

    input CommentQuery {
      limit: Int!
      sortOrder: SortOrder!
    }

    type Comment {
      replies(query: CommentQuery = { sortOrder: ASC, limit: 3 }): String!
    }
  `);

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(0);
});

test('array as default value in input (same)', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    enum SortOrder {
      ASC
    }

    input CommentQuery {
      limit: Int!
      sortOrder: [SortOrder] = [ASC]
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    enum SortOrder {
      ASC
    }

    input CommentQuery {
      limit: Int!
      sortOrder: [SortOrder] = [ASC]
    }
  `);

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(0);
});

test('array as default value in input (different)', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    enum SortOrder {
      ASC
      DEC
    }

    input CommentQuery {
      limit: Int!
      sortOrder: [SortOrder] = [ASC]
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    enum SortOrder {
      ASC
      DEC
    }

    input CommentQuery {
      limit: Int!
      sortOrder: [SortOrder] = [DEC]
    }
  `);

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(1);
  expect(changes[0]).toBeDefined();
  expect(changes[0].criticality.level).toEqual(CriticalityLevel.Dangerous);
  expect(changes[0].message).toEqual(
    `Input field 'CommentQuery.sortOrder' default value changed from '[ 'ASC' ]' to '[ 'DEC' ]'`,
  );
  expect(changes[0].path).toEqual(`CommentQuery.sortOrder`);
});

test('Input fields becoming nullable is a non-breaking change', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    scalar CustomScalar

    input CommentQuery {
      limit: Int!
      query: String!
      detail: Detail!
      customScalar: CustomScalar!
    }

    input Detail {
      field: String!
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    scalar CustomScalar

    input CommentQuery {
      limit: Int
      query: String
      detail: Detail
      customScalar: CustomScalar
    }

    input Detail {
      field: String!
    }
  `);

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(4);

  expect(changes[0]).toBeDefined();
  expect(changes[0].criticality.level).toEqual(CriticalityLevel.NonBreaking);
  expect(changes[0].message).toEqual(
    `Input field 'CommentQuery.limit' changed type from 'Int!' to 'Int'`,
  );

  expect(changes[1]).toBeDefined();
  expect(changes[1].criticality.level).toEqual(CriticalityLevel.NonBreaking);
  expect(changes[1].message).toEqual(
    `Input field 'CommentQuery.query' changed type from 'String!' to 'String'`,
  );

  expect(changes[2]).toBeDefined();
  expect(changes[2].criticality.level).toEqual(CriticalityLevel.NonBreaking);
  expect(changes[2].message).toEqual(
    `Input field 'CommentQuery.detail' changed type from 'Detail!' to 'Detail'`,
  );

  expect(changes[3]).toBeDefined();
  expect(changes[3].criticality.level).toEqual(CriticalityLevel.NonBreaking);
  expect(changes[3].message).toEqual(
    `Input field 'CommentQuery.customScalar' changed type from 'CustomScalar!' to 'CustomScalar'`,
  );
});

test('Input fields becoming non-nullable is a breaking change', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    scalar CustomScalar

    input CommentQuery {
      limit: Int
      query: String
      detail: Detail
      customScalar: CustomScalar
    }

    input Detail {
      field: String!
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    scalar CustomScalar

    input CommentQuery {
      limit: Int!
      query: String!
      detail: Detail!
      customScalar: CustomScalar!
    }

    input Detail {
      field: String!
    }
  `);

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(4);

  expect(changes[0]).toBeDefined();
  expect(changes[0].criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(changes[0].message).toEqual(
    `Input field 'CommentQuery.limit' changed type from 'Int' to 'Int!'`,
  );

  expect(changes[1]).toBeDefined();
  expect(changes[1].criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(changes[1].message).toEqual(
    `Input field 'CommentQuery.query' changed type from 'String' to 'String!'`,
  );

  expect(changes[2]).toBeDefined();
  expect(changes[2].criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(changes[2].message).toEqual(
    `Input field 'CommentQuery.detail' changed type from 'Detail' to 'Detail!'`,
  );

  expect(changes[3]).toBeDefined();
  expect(changes[3].criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(changes[3].message).toEqual(
    `Input field 'CommentQuery.customScalar' changed type from 'CustomScalar' to 'CustomScalar!'`,
  );
});

test('Query fields becoming non-nullable is a non-breaking change', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    scalar CustomScalar

    type Comment {
      limit: Int
      query: String
      detail: Detail
      customScalar: CustomScalar
    }

    type Detail {
      field: String!
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    scalar CustomScalar

    type Comment {
      limit: Int!
      query: String!
      detail: Detail!
      customScalar: CustomScalar!
    }

    type Detail {
      field: String!
    }
  `);

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(4);

  expect(changes[0]).toBeDefined();
  expect(changes[0].criticality.level).toEqual(CriticalityLevel.NonBreaking);
  expect(changes[0].message).toEqual(`Field 'Comment.limit' changed type from 'Int' to 'Int!'`);

  expect(changes[1]).toBeDefined();
  expect(changes[1].criticality.level).toEqual(CriticalityLevel.NonBreaking);
  expect(changes[1].message).toEqual(
    `Field 'Comment.query' changed type from 'String' to 'String!'`,
  );

  expect(changes[2]).toBeDefined();
  expect(changes[2].criticality.level).toEqual(CriticalityLevel.NonBreaking);
  expect(changes[2].message).toEqual(
    `Field 'Comment.detail' changed type from 'Detail' to 'Detail!'`,
  );

  expect(changes[3]).toBeDefined();
  expect(changes[3].criticality.level).toEqual(CriticalityLevel.NonBreaking);
  expect(changes[3].message).toEqual(
    `Field 'Comment.customScalar' changed type from 'CustomScalar' to 'CustomScalar!'`,
  );
});

test('Query fields becoming nullable is a breaking change', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    scalar CustomScalar

    type Comment {
      limit: Int!
      query: String!
      detail: Detail!
      customScalar: CustomScalar!
    }

    type Detail {
      field: String!
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    scalar CustomScalar

    type Comment {
      limit: Int
      query: String
      detail: Detail
      customScalar: CustomScalar
    }

    type Detail {
      field: String!
    }
  `);

  const changes = await diff(schemaA, schemaB);

  expect(changes.length).toEqual(4);

  expect(changes[0]).toBeDefined();
  expect(changes[0].criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(changes[0].message).toEqual(`Field 'Comment.limit' changed type from 'Int!' to 'Int'`);

  expect(changes[1]).toBeDefined();
  expect(changes[1].criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(changes[1].message).toEqual(
    `Field 'Comment.query' changed type from 'String!' to 'String'`,
  );

  expect(changes[2]).toBeDefined();
  expect(changes[2].criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(changes[2].message).toEqual(
    `Field 'Comment.detail' changed type from 'Detail!' to 'Detail'`,
  );

  expect(changes[3]).toBeDefined();
  expect(changes[3].criticality.level).toEqual(CriticalityLevel.Breaking);
  expect(changes[3].message).toEqual(
    `Field 'Comment.customScalar' changed type from 'CustomScalar!' to 'CustomScalar'`,
  );
});

test('should work with with missing directive definitions', async () => {
  const schemaA = buildSchema(
    /* GraphQL */ `
      type Query {
        foo: String! @md
        bar: String! @md
      }
    `,
    {
      assumeValid: true,
      assumeValidSDL: true,
    },
  );

  const schemaB = buildSchema(
    /* GraphQL */ `
      type Query {
        foo: String! @md
        bar: String
      }
    `,
    {
      assumeValid: true,
      assumeValidSDL: true,
    },
  );

  const changes = await diff(schemaA, schemaB);

  expect(changes).toHaveLength(2);
});

test('adding root type should not be breaking', async () => {
  const schemaA = buildSchema(/* GraphQL */ `
    type Query {
      foo: String
    }
  `);

  const schemaB = buildSchema(/* GraphQL */ `
    type Query {
      foo: String
    }

    type Subscription {
      onFoo: String
    }
  `);

  const changes = await diff(schemaA, schemaB);
  expect(changes).toMatchInlineSnapshot(`
    [
      {
        "criticality": {
          "level": "NON_BREAKING",
        },
        "message": "Schema subscription root has changed from 'unknown' to 'Subscription'",
        "meta": {
          "newSubscriptionTypeName": "Subscription",
          "oldSubscriptionTypeName": "unknown",
        },
        "type": "SCHEMA_SUBSCRIPTION_TYPE_CHANGED",
      },
      {
        "criticality": {
          "level": "NON_BREAKING",
        },
        "message": "Type 'Subscription' was added",
        "meta": {
          "addedTypeKind": "ObjectTypeDefinition",
          "addedTypeName": "Subscription",
        },
        "path": "Subscription",
        "type": "TYPE_ADDED",
      },
      {
        "criticality": {
          "level": "NON_BREAKING",
        },
        "message": "Field 'onFoo' was added to object type 'Subscription'",
        "meta": {
          "addedFieldName": "onFoo",
          "addedFieldReturnType": "String",
          "typeName": "Subscription",
          "typeType": "object type",
        },
        "path": "Subscription.onFoo",
        "type": "FIELD_ADDED",
      },
    ]
  `);
});
