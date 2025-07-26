import { buildSchema } from 'graphql';
import { ignoreNestedAdditions } from '../../../src/diff/rules/index.js';
import { ChangeType, CriticalityLevel, diff } from '../../../src/index.js';
import { findFirstChangeByPath } from '../../../utils/testing.js';

describe('ignoreNestedAdditions rule', () => {
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

    const changes = await diff(a, b, [ignoreNestedAdditions]);
    expect(changes).toHaveLength(1);

    const added = findFirstChangeByPath(changes, 'Foo.a');
    expect(added).toBe(undefined);
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

    const changes = await diff(a, b, [ignoreNestedAdditions]);
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

    const changes = await diff(a, b, [ignoreNestedAdditions]);

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

    const changes = await diff(a, b, [ignoreNestedAdditions]);
    expect(changes).toHaveLength(1);

    const added = findFirstChangeByPath(changes, 'Foo.b');
    expect(added.type).toBe(ChangeType.FieldAdded);
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

    const changes = await diff(a, b, [ignoreNestedAdditions]);

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

    const changes = await diff(a, b, [ignoreNestedAdditions]);
    expect(changes).toHaveLength(1);

    const added = findFirstChangeByPath(changes, '@special');
    expect(added.type).toBe(ChangeType.DirectiveAdded);
  });
});
