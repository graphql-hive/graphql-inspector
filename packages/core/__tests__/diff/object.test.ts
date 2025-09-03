import { buildSchema } from 'graphql';
import { CriticalityLevel, diff, DiffRule } from '../../src/index.js';
import { findChangesByPath, findFirstChangeByPath } from '../../utils/testing.js';

describe('object', () => {
  test('added', async () => {
    const a = buildSchema(/* GraphQL */ `
      type A {
        a: String!
      }

      type Foo {
        a: String!
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type A {
        a: String!
      }

      type B {
        a: String!
      }

      type Mutation {
        noop: String
      }

      type Foo {
        a: String!
      }
    `);

    const changes = await diff(a, b);
    expect(changes).toHaveLength(5);

    const change = findFirstChangeByPath(changes, 'B');
    const mutation = findFirstChangeByPath(changes, 'Mutation');

    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(mutation.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.meta).toMatchObject({
      addedTypeKind: 'ObjectTypeDefinition',
      addedTypeName: 'B',
    });
  });

  describe('interfaces', () => {
    test('added', async () => {
      const a = buildSchema(/* GraphQL */ `
        interface A {
          a: String!
        }

        interface B {
          b: String!
        }

        type Foo implements A & B {
          a: String!
          b: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        interface A {
          a: String!
        }

        interface B {
          b: String!
        }

        interface C implements B {
          b: String!
          c: String!
        }

        type Foo implements A & B & C {
          a: String!
          b: String!
          c: String!
        }
      `);

      const changes = await diff(a, b);

      {
        const change = findFirstChangeByPath(changes, 'Foo');
        expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
        expect(change.type).toEqual('OBJECT_TYPE_INTERFACE_ADDED');
        expect(change.message).toEqual("'Foo' object implements 'C' interface");
        expect(change.meta).toMatchObject({
          addedInterfaceName: 'C',
          objectTypeName: 'Foo',
        });
      }

      const cChanges = findChangesByPath(changes, 'C');
      expect(cChanges).toHaveLength(2);
      {
        const change = cChanges[0];
        expect(change.type).toEqual('TYPE_ADDED');
        expect(change.meta).toMatchObject({
          addedTypeKind: 'InterfaceTypeDefinition',
          addedTypeName: 'C',
        });
      }

      {
        const change = cChanges[1];
        expect(change.type).toEqual('OBJECT_TYPE_INTERFACE_ADDED');
        expect(change.meta).toMatchObject({
          addedInterfaceName: 'B',
          objectTypeName: 'C',
        });
      }

      {
        const change = findFirstChangeByPath(changes, 'C.b');
        expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      }
    });

    test('removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        interface A {
          a: String!
        }

        interface B {
          b: String!
        }

        interface C {
          c: String!
        }

        type Foo implements A & B & C {
          a: String!
          b: String!
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        interface A {
          a: String!
        }

        interface B {
          b: String!
        }

        type Foo implements A & B {
          a: String!
          b: String!
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Foo');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('OBJECT_TYPE_INTERFACE_REMOVED');
      expect(change.message).toEqual("'Foo' object type no longer implements 'C' interface");
    });
  });

  describe('fields', () => {
    test('added', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          a: String!
          b: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          a: String!
          b: String!
          c: String!
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Foo.c');

      expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.type).toEqual('FIELD_ADDED');
      expect(change.message).toEqual("Field 'c' was added to object type 'Foo'");
    });
    test('removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          a: String!
          b: String!
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          a: String!
          b: String!
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Foo.c');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('FIELD_REMOVED');
      expect(change.message).toEqual("Field 'c' was removed from object type 'Foo'");
    });

    test('order changed', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          a: String!
          b: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          b: String!
          a: String!
        }
      `);

      expect(await diff(a, b)).toHaveLength(0);
    });

    test('type changed', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          a: String!
          b: String
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          a: Int!
          b: String!
          c: String
        }
      `);

      const changes = await diff(a, b);
      const change = {
        a: findFirstChangeByPath(changes, 'Foo.a'),
        b: findFirstChangeByPath(changes, 'Foo.b'),
        c: findFirstChangeByPath(changes, 'Foo.c'),
      };

      // Whole new type
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.a.type).toEqual('FIELD_TYPE_CHANGED');
      expect(change.a.message).toEqual("Field 'Foo.a' changed type from 'String!' to 'Int!'");
      // Nullable to non-nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.b.type).toEqual('FIELD_TYPE_CHANGED');
      expect(change.b.message).toEqual("Field 'Foo.b' changed type from 'String' to 'String!'");
      // Non-nullable to nullable
      expect(change.c.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.c.type).toEqual('FIELD_TYPE_CHANGED');
      expect(change.c.message).toEqual("Field 'Foo.c' changed type from 'String!' to 'String'");
    });

    test('description changed / added / removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          """
          OLD
          """
          a: String!
          """
          BBB
          """
          b: String!
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          """
          NEW
          """
          a: String!
          b: String!
          """
          CCC
          """
          c: String!
        }
      `);

      const changes = await diff(a, b);
      const change = {
        a: findFirstChangeByPath(changes, 'Foo.a'),
        b: findFirstChangeByPath(changes, 'Foo.b'),
        c: findFirstChangeByPath(changes, 'Foo.c'),
      };

      // Changed
      expect(change.a.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.a.type).toEqual('FIELD_DESCRIPTION_CHANGED');
      expect(change.a.message).toEqual("Field 'Foo.a' description changed from 'OLD' to 'NEW'");
      // Removed
      expect(change.b.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.b.type).toEqual('FIELD_DESCRIPTION_REMOVED');
      expect(change.b.message).toEqual("Description was removed from field 'Foo.b'");
      // Added
      expect(change.c.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.c.type).toEqual('FIELD_DESCRIPTION_ADDED');
      expect(change.c.message).toEqual("Field 'Foo.c' has description 'CCC'");
    });

    test('deprecation reason changed / added / removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          a: String! @deprecated(reason: "OLD")
          b: String! @deprecated(reason: "BBB")
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          a: String! @deprecated(reason: "NEW")
          b: String!
          c: String! @deprecated(reason: "CCC")
        }
      `);

      const changes = await diff(a, b);
      const change = {
        a: findFirstChangeByPath(changes, 'Foo.a.@deprecated'),
        b: findFirstChangeByPath(changes, 'Foo.b.@deprecated'),
        c: findFirstChangeByPath(changes, 'Foo.c.@deprecated'),
      };

      // Changed
      expect(change.a.type).toEqual('FIELD_DEPRECATION_REASON_CHANGED');
      expect(change.a.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.a.message).toEqual(
        "Deprecation reason on field 'Foo.a' has changed from 'OLD' to 'NEW'",
      );
      // Removed
      expect(change.b.type).toEqual('FIELD_DEPRECATION_REMOVED');
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.b.message).toEqual("Field 'Foo.b' is no longer deprecated");
      // Added
      expect(change.c.type).toEqual('FIELD_DEPRECATION_ADDED');
      expect(change.c.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.c.message).toEqual("Field 'Foo.c' is deprecated");
    });

    test('deprecation added / removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          a: String! @deprecated
          b: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          a: String!
          b: String! @deprecated
        }
      `);

      const changes = await diff(a, b);
      const change = {
        a: findFirstChangeByPath(changes, 'Foo.a.@deprecated'),
        b: findFirstChangeByPath(changes, 'Foo.b.@deprecated'),
      };

      // Changed
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.a.type).toEqual('FIELD_DEPRECATION_REMOVED');
      expect(change.a.message).toEqual("Field 'Foo.a' is no longer deprecated");
      // Removed
      expect(change.b.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.b.type).toEqual('FIELD_DEPRECATION_ADDED');
      expect(change.b.message).toEqual("Field 'Foo.b' is deprecated");
    });

    test('removal of a deprecated field', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          a: String!
          b: String! @deprecated
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          a: String!
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Foo.b');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('FIELD_REMOVED');
      expect(change.message).toEqual("Field 'b' (deprecated) was removed from object type 'Foo'");

      // suppressRemovalOfDeprecatedField rule should make it only Dangerous

      const changeWithRule = findFirstChangeByPath(
        await diff(a, b, [DiffRule.suppressRemovalOfDeprecatedField]),
        'Foo.b',
      );

      expect(changeWithRule.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(changeWithRule.type).toEqual('FIELD_REMOVED');
      expect(changeWithRule.message).toEqual(
        "Field 'b' (deprecated) was removed from object type 'Foo'",
      );
    });
  });

  describe('arguments', () => {
    test('type changed', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          foo(a: String, b: String, c: String!): String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          foo(a: Int, b: String!, c: String): String
        }
      `);

      const changes = await diff(a, b);
      const change = {
        a: findFirstChangeByPath(changes, 'Foo.foo.a'),
        b: findFirstChangeByPath(changes, 'Foo.foo.b'),
        c: findFirstChangeByPath(changes, 'Foo.foo.c'),
      };

      // Whole new type
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.a.type).toEqual('FIELD_ARGUMENT_TYPE_CHANGED');
      expect(change.a.message).toEqual(
        "Type for argument 'a' on field 'Foo.foo' changed from 'String' to 'Int'",
      );
      // Nullable to non-nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.b.type).toEqual('FIELD_ARGUMENT_TYPE_CHANGED');
      expect(change.b.message).toEqual(
        "Type for argument 'b' on field 'Foo.foo' changed from 'String' to 'String!'",
      );
      // Non-nullable to nullable
      expect(change.c.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.c.type).toEqual('FIELD_ARGUMENT_TYPE_CHANGED');
      expect(change.c.message).toEqual(
        "Type for argument 'c' on field 'Foo.foo' changed from 'String!' to 'String'",
      );
    });

    test('added', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          foo(a: String): String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          foo(a: String, b: String!, c: String): String
        }
      `);

      const changes = await diff(a, b);
      const change = {
        b: findFirstChangeByPath(changes, 'Foo.foo.b'),
        c: findFirstChangeByPath(changes, 'Foo.foo.c'),
      };

      // Added non-nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.b.type).toEqual('FIELD_ARGUMENT_ADDED');
      expect(change.b.message).toEqual("Argument 'b: String!' added to field 'Foo.foo'");
      // Added nullable
      expect(change.c.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.c.type).toEqual('FIELD_ARGUMENT_ADDED');
      expect(change.c.message).toEqual("Argument 'c: String' added to field 'Foo.foo'");
    });

    test('removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Foo {
          foo(a: String, b: String!, c: String): String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Foo {
          foo(a: String): String
        }
      `);

      const changes = await diff(a, b);
      const change = {
        b: findFirstChangeByPath(changes, 'Foo.foo.b'),
        c: findFirstChangeByPath(changes, 'Foo.foo.c'),
      };

      // Removed non-nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.b.type).toEqual('FIELD_ARGUMENT_REMOVED');
      expect(change.b.message).toEqual("Argument 'b: String!' was removed from field 'Foo.foo'");
      // Removed nullable
      expect(change.c.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.c.type).toEqual('FIELD_ARGUMENT_REMOVED');
      expect(change.c.message).toEqual("Argument 'c: String' was removed from field 'Foo.foo'");
    });
  });
});
