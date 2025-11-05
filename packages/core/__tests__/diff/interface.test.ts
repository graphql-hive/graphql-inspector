import { buildSchema } from 'graphql';
import { CriticalityLevel, diff } from '../../src/index.js';
import { findChangesByPath, findFirstChangeByPath } from '../../utils/testing.js';

describe('interface', () => {
  describe('fields', () => {
    test('added', async () => {
      const a = buildSchema(/* GraphQL */ `
        interface Foo {
          a: String!
          b: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        interface Foo {
          a: String!
          b: String!
          c: String!
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Foo.c');

      expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.type).toEqual('FIELD_ADDED');
      expect(change.message).toEqual("Field 'c' was added to interface 'Foo'");
    });
    test('removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        interface Foo {
          a: String!
          b: String!
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        interface Foo {
          a: String!
          b: String!
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Foo.c');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('FIELD_REMOVED');
      expect(change.message).toEqual("Field 'c' was removed from interface 'Foo'");
    });

    test('order changed', async () => {
      const a = buildSchema(/* GraphQL */ `
        interface Foo {
          a: String!
          b: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        interface Foo {
          b: String!
          a: String!
        }
      `);

      expect(await diff(a, b)).toHaveLength(0);
    });

    test('type changed', async () => {
      const a = buildSchema(/* GraphQL */ `
        interface Foo {
          a: String!
          b: String
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        interface Foo {
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
        interface Foo {
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
        interface Foo {
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
        interface Foo {
          a: String! @deprecated(reason: "OLD")
          b: String! @deprecated(reason: "BBB")
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        interface Foo {
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
      expect(change.b.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.b.message).toEqual("Field 'Foo.b' is no longer deprecated");
      // Added
      expect(change.c.type).toEqual('FIELD_DEPRECATION_ADDED');
      expect(change.c.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.c.message).toEqual("Field 'Foo.c' is deprecated");
    });

    test('deprecation added / removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        interface Foo {
          a: String! @deprecated
          b: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        interface Foo {
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
      expect(change.a.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.a.type).toEqual('FIELD_DEPRECATION_REMOVED');
      expect(change.a.message).toEqual("Field 'Foo.a' is no longer deprecated");
      // Removed
      expect(change.b.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.b.type).toEqual('FIELD_DEPRECATION_ADDED');
      expect(change.b.message).toEqual("Field 'Foo.b' is deprecated");
    });
  });

  test('deprecation added w/reason', async () => {
    const a = buildSchema(/* GraphQL */ `
      interface Foo {
        a: String!
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      interface Foo {
        a: String! @deprecated(reason: "A is the first letter.")
      }
    `);

    const changes = await diff(a, b);

    // one for deprecation added, and one for the reason added
    expect(findChangesByPath(changes, 'Foo.a.@deprecated')).toHaveLength(2);
    const change = findFirstChangeByPath(changes, 'Foo.a.@deprecated');

    // added
    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.type).toEqual('FIELD_DEPRECATION_ADDED');
    expect(change.message).toEqual("Field 'Foo.a' is deprecated");
    expect(change.meta).toMatchObject({
      deprecationReason: 'A is the first letter.',
      fieldName: 'a',
      typeName: 'Foo',
    });
  });
});
