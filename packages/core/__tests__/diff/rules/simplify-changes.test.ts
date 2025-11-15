import { buildSchema } from 'graphql';
import { simplifyChanges } from '../../../src/diff/rules/index.js';
import { ChangeType, CriticalityLevel, diff } from '../../../src/index.js';
import { findFirstChangeByPath } from '../../../utils/testing.js';

describe('simplifyChanges rule', () => {
  test('added field on new object', async () => {
    const a = buildSchema(/* GraphQL */ `
      scalar A
    `);
    const b = buildSchema(/* GraphQL */ `
      scalar A
      type Foo {
        a(b: String): String! @deprecated(reason: "As a test")
      }
    `);

    const changes = await diff(a, b, [simplifyChanges]);
    expect(changes).toHaveLength(1);

    const added = findFirstChangeByPath(changes, 'Foo.a');
    expect(added).toBe(undefined);
  });

  test('removed field on a removed object', async () => {
    const a = buildSchema(/* GraphQL */ `
      scalar A
      type Foo {
        a(b: String): String! @deprecated(reason: "As a test")
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      scalar A
    `);

    const changes = await diff(a, b, [simplifyChanges]);
    expect(changes).toHaveLength(1);

    const removed = findFirstChangeByPath(changes, 'Foo.a');
    expect(removed).toBe(undefined);
  });

  test('added field on new interface', async () => {
    const a = buildSchema(/* GraphQL */ `
      scalar A
    `);
    const b = buildSchema(/* GraphQL */ `
      scalar A
      interface Foo {
        a(b: String): String! @deprecated(reason: "As a test")
      }
    `);

    const changes = await diff(a, b, [simplifyChanges]);
    expect(changes).toHaveLength(1);

    const added = findFirstChangeByPath(changes, 'Foo.a');
    expect(added).toBe(undefined);
  });

  test('added value on new enum', async () => {
    const a = buildSchema(/* GraphQL */ `
      scalar A
    `);
    const b = buildSchema(/* GraphQL */ `
      scalar A
      """
      Here is a new enum named B
      """
      enum B {
        """
        It has newly added values
        """
        C @deprecated(reason: "With deprecations")
        D
      }
    `);

    const changes = await diff(a, b, [simplifyChanges]);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      criticality: {
        level: CriticalityLevel.NonBreaking,
      },
      message: "Type 'B' was added",
      meta: {
        addedTypeKind: 'EnumTypeDefinition',
        addedTypeName: 'B',
      },
      path: 'B',
      type: ChangeType.TypeAdded,
    });
  });

  test('removed value on removed enum', async () => {
    const a = buildSchema(/* GraphQL */ `
      scalar A
      """
      Here is a new enum named B
      """
      enum B {
        """
        It has newly added values
        """
        C @deprecated(reason: "With deprecations")
        D
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      scalar A
    `);

    const changes = await diff(a, b, [simplifyChanges]);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      criticality: {
        level: CriticalityLevel.Breaking,
      },
      message: "Type 'B' was removed",
      meta: {
        removedTypeName: 'B',
      },
      path: 'B',
      type: ChangeType.TypeRemoved,
    });
  });

  test('added argument / directive / deprecation / reason on new field', async () => {
    const a = buildSchema(/* GraphQL */ `
      scalar A
      type Foo {
        a: String!
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      scalar A
      type Foo {
        a: String!
        b(b: String): String! @deprecated(reason: "As a test")
      }
    `);

    const changes = await diff(a, b, [simplifyChanges]);
    expect(changes).toHaveLength(1);

    const added = findFirstChangeByPath(changes, 'Foo.b');
    expect(added.type).toBe(ChangeType.FieldAdded);
    expect(added.meta).toEqual({
      addedFieldName: 'b',
      addedFieldReturnType: 'String!',
      typeName: 'Foo',
      typeType: 'object type',
    });
  });

  test('added type / directive / directive argument on new union', async () => {
    const a = buildSchema(/* GraphQL */ `
      scalar A
    `);
    const b = buildSchema(/* GraphQL */ `
      scalar A
      directive @special(reason: String) on UNION

      type Foo {
        a: String!
      }

      union FooUnion @special(reason: "As a test") = Foo
    `);

    const changes = await diff(a, b, [simplifyChanges]);

    {
      const added = findFirstChangeByPath(changes, 'FooUnion');
      expect(added?.type).toBe(ChangeType.TypeAdded);
    }

    {
      const added = findFirstChangeByPath(changes, 'Foo');
      expect(added?.type).toBe(ChangeType.TypeAdded);
    }

    {
      const added = findFirstChangeByPath(changes, '@special');
      expect(added?.type).toBe(ChangeType.DirectiveAdded);
    }

    expect(changes).toHaveLength(3);
  });

  test('added argument / location / description on new directive', async () => {
    const a = buildSchema(/* GraphQL */ `
      scalar A
    `);
    const b = buildSchema(/* GraphQL */ `
      scalar A
      directive @special(reason: String) on UNION | FIELD_DEFINITION
    `);

    const changes = await diff(a, b, [simplifyChanges]);
    expect(changes).toHaveLength(1);

    const added = findFirstChangeByPath(changes, '@special');
    expect(added.type).toBe(ChangeType.DirectiveAdded);
  });

  test('deprecation added', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Foo {
        bar: String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Foo {
        bar: String @deprecated(reason: "Because")
      }
    `);

    const changes = await diff(a, b, [simplifyChanges]);
    expect(changes).toHaveLength(1);
    const change = findFirstChangeByPath(changes, 'Foo.bar.@deprecated');

    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.type).toEqual('FIELD_DEPRECATION_ADDED');
    expect(change.message).toEqual("Field 'Foo.bar' is deprecated");
  });

  test('deprecation changed', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Foo {
        bar: String @deprecated(reason: "Before")
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Foo {
        bar: String @deprecated(reason: "After")
      }
    `);

    const changes = await diff(a, b, [simplifyChanges]);
    expect(changes).toHaveLength(1);
    const change = findFirstChangeByPath(changes, 'Foo.bar.@deprecated');

    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.type).toEqual('FIELD_DEPRECATION_REASON_CHANGED');
    expect(change.message).toEqual(
      "Deprecation reason on field 'Foo.bar' has changed from 'Before' to 'After'",
    );
  });

  test('deprecation removed', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Foo {
        bar: String @deprecated(reason: "Because")
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Foo {
        bar: String
      }
    `);

    const changes = await diff(a, b, [simplifyChanges]);
    expect(changes).toHaveLength(1);
    const change = findFirstChangeByPath(changes, 'Foo.bar.@deprecated');

    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.type).toEqual('FIELD_DEPRECATION_REMOVED');
    expect(change.message).toEqual("Field 'Foo.bar' is no longer deprecated");
  });

  test('same node contains multiple changes', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        users: [User!]
      }

      enum UserRole {
        ADMIN
        EDITOR
      }

      type User {
        id: ID!
        name: String!
        email: String!
        role: UserRole
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      type Query {
        users: [User!]
      }

      enum UserRole {
        ADMIN
        EDITOR
        VIEWER
      }

      type User {
        id: ID!
        name: String!
        address: String
        role: UserRole!
      }
    `);

    const changes = await diff(a, b, [simplifyChanges]);
    // `User` has 3 fields that change
    expect(changes).toHaveLength(4);
    expect(changes).toMatchInlineSnapshot(`
      [
        {
          "criticality": {
            "level": "DANGEROUS",
            "reason": "Adding an enum value may break existing clients that were not programming defensively against an added case when querying an enum.",
          },
          "message": "Enum value 'VIEWER' was added to enum 'UserRole'",
          "meta": {
            "addedDirectiveDescription": null,
            "addedEnumValueName": "VIEWER",
            "addedToNewType": false,
            "enumName": "UserRole",
          },
          "path": "UserRole.VIEWER",
          "type": "ENUM_VALUE_ADDED",
        },
        {
          "criticality": {
            "level": "BREAKING",
            "reason": "Removing a field is a breaking change. It is preferable to deprecate the field before removing it. This applies to removed union fields as well, since removal breaks client operations that contain fragments that reference the removed type through direct (... on RemovedType) or indirect means such as __typename in the consumers.",
          },
          "message": "Field 'email' was removed from object type 'User'",
          "meta": {
            "isRemovedFieldDeprecated": false,
            "removedFieldName": "email",
            "typeName": "User",
            "typeType": "object type",
          },
          "path": "User.email",
          "type": "FIELD_REMOVED",
        },
        {
          "criticality": {
            "level": "NON_BREAKING",
          },
          "message": "Field 'address' was added to object type 'User'",
          "meta": {
            "addedFieldName": "address",
            "addedFieldReturnType": "String",
            "typeName": "User",
            "typeType": "object type",
          },
          "path": "User.address",
          "type": "FIELD_ADDED",
        },
        {
          "criticality": {
            "level": "NON_BREAKING",
          },
          "message": "Field 'User.role' changed type from 'UserRole' to 'UserRole!'",
          "meta": {
            "fieldName": "role",
            "isSafeFieldTypeChange": true,
            "newFieldType": "UserRole!",
            "oldFieldType": "UserRole",
            "typeName": "User",
          },
          "path": "User.role",
          "type": "FIELD_TYPE_CHANGED",
        },
      ]
    `);
  });
});
