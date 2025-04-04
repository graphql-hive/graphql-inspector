import { buildSchema } from 'graphql';
import { CriticalityLevel, diff, DiffRule } from '../../src/index.js';
import { findFirstChangeByPath } from '../../utils/testing.js';

describe('input', () => {
  describe('fields', () => {
    test('added', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: String!
          c: String!
          d: String
          e: String! = "Eee"
        }
      `);

      const changes = await diff(a, b);
      const change = {
        c: findFirstChangeByPath(changes, 'Foo.c'),
        d: findFirstChangeByPath(changes, 'Foo.d'),
        e: findFirstChangeByPath(changes, 'Foo.e'),
      };

      // Non-nullable without default
      expect(change.c.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.c.type).toEqual('INPUT_FIELD_ADDED');
      expect(change.c.message).toEqual(
        "Input field 'c' of type 'String!' was added to input object type 'Foo'",
      );
      // Nullable
      expect(change.d.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.d.type).toEqual('INPUT_FIELD_ADDED');
      expect(change.d.message).toEqual(
        "Input field 'd' of type 'String' was added to input object type 'Foo'",
      );
      // Non-nullable with default
      expect(change.e.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.e.type).toEqual('INPUT_FIELD_ADDED');
      expect(change.e.message).toEqual(
        "Input field 'e' of type 'String!' was added to input object type 'Foo'",
      );
    });
    test('removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: String!
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: String!
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Foo.c');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('INPUT_FIELD_REMOVED');
      expect(change.message).toEqual("Input field 'c' was removed from input object type 'Foo'");
    });

    test('order changed', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
          b: String!
          a: String!
        }
      `);

      expect(await diff(a, b)).toHaveLength(0);
    });

    test('type changed', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: String
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
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
      expect(change.a.type).toEqual('INPUT_FIELD_TYPE_CHANGED');
      expect(change.a.message).toEqual("Input field 'Foo.a' changed type from 'String!' to 'Int!'");
      // Nullable to non-nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.b.type).toEqual('INPUT_FIELD_TYPE_CHANGED');
      expect(change.b.message).toEqual(
        "Input field 'Foo.b' changed type from 'String' to 'String!'",
      );
      // Non-nullable to nullable
      expect(change.c.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.c.type).toEqual('INPUT_FIELD_TYPE_CHANGED');
      expect(change.c.message).toEqual(
        "Input field 'Foo.c' changed type from 'String!' to 'String'",
      );
    });

    test('description changed / added / removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
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
        input Foo {
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
      expect(change.a.type).toEqual('INPUT_FIELD_DESCRIPTION_CHANGED');
      expect(change.a.message).toEqual(
        "Input field 'Foo.a' description changed from 'OLD' to 'NEW'",
      );
      // Removed
      expect(change.b.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.b.type).toEqual('INPUT_FIELD_DESCRIPTION_REMOVED');
      expect(change.b.message).toEqual("Description 'BBB' was removed from input field 'Foo.b'");
      // Added
      expect(change.c.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.c.type).toEqual('INPUT_FIELD_DESCRIPTION_ADDED');
      expect(change.c.message).toEqual(`Input field 'Foo.c' has description 'CCC'`);
    });

    test('default value added', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
          a: String! = "Aaa"
          b: String = "Bbb"
        }
      `);

      const change = {
        a: findFirstChangeByPath(await diff(a, b), 'Foo.a'),
        b: findFirstChangeByPath(await diff(a, b), 'Foo.b'),
      };

      // Non-nullable
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.a.type).toEqual('INPUT_FIELD_DEFAULT_VALUE_CHANGED');
      expect(change.a.message).toEqual(
        `Input field 'Foo.a' default value changed from 'undefined' to '"Aaa"'`,
      );
      // Nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.b.type).toEqual('INPUT_FIELD_DEFAULT_VALUE_CHANGED');
      expect(change.b.message).toEqual(
        `Input field 'Foo.b' default value changed from 'undefined' to '"Bbb"'`,
      );
    });

    test('default value removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String! = "Aaa"
          b: String = "Bbb"
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: String
        }
      `);

      const change = {
        a: findFirstChangeByPath(await diff(a, b), 'Foo.a'),
        b: findFirstChangeByPath(await diff(a, b), 'Foo.b'),
      };

      // Non-nullable
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.a.type).toEqual('INPUT_FIELD_DEFAULT_VALUE_CHANGED');
      expect(change.a.message).toEqual(
        `Input field 'Foo.a' default value changed from '"Aaa"' to 'undefined'`,
      );
      // Nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.b.type).toEqual('INPUT_FIELD_DEFAULT_VALUE_CHANGED');
      expect(change.b.message).toEqual(
        `Input field 'Foo.b' default value changed from '"Bbb"' to 'undefined'`,
      );
    });
    test('field removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: String!
          c: String!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: String!
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Foo.c');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('INPUT_FIELD_REMOVED');
      expect(change.message).toEqual("Input field 'c' was removed from input object type 'Foo'");
    });

    test('field made optional', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: [String!]!
          c: [String!]!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
          a: String
          b: [String!]
          c: [String]!
        }
      `);

      const change = {
        a: findFirstChangeByPath(await diff(a, b), 'Foo.a'),
        b: findFirstChangeByPath(await diff(a, b), 'Foo.b'),
        c: findFirstChangeByPath(await diff(a, b), 'Foo.c'),
      };

      // Scalar
      expect(change.a.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.a.type).toEqual('INPUT_FIELD_TYPE_CHANGED');
      expect(change.a.message).toEqual(
        "Input field 'Foo.a' changed type from 'String!' to 'String'",
      );
      // List
      expect(change.b.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.b.type).toEqual('INPUT_FIELD_TYPE_CHANGED');
      expect(change.b.message).toEqual(
        "Input field 'Foo.b' changed type from '[String!]!' to '[String!]'",
      );
      // List value
      expect(change.c.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.c.type).toEqual('INPUT_FIELD_TYPE_CHANGED');
      expect(change.c.message).toEqual(
        "Input field 'Foo.c' changed type from '[String!]!' to '[String]!'",
      );
    });

    test('field made non-optional', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String
          b: [String!]
          c: [String]!
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
          b: [String!]!
          c: [String!]!
        }
      `);

      const change = {
        a: findFirstChangeByPath(await diff(a, b), 'Foo.a'),
        b: findFirstChangeByPath(await diff(a, b), 'Foo.b'),
        c: findFirstChangeByPath(await diff(a, b), 'Foo.c'),
      };

      // Scalar
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.a.type).toEqual('INPUT_FIELD_TYPE_CHANGED');
      expect(change.a.message).toEqual(
        "Input field 'Foo.a' changed type from 'String' to 'String!'",
      );
      // List
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.b.type).toEqual('INPUT_FIELD_TYPE_CHANGED');
      expect(change.b.message).toEqual(
        "Input field 'Foo.b' changed type from '[String!]' to '[String!]!'",
      );
      // List value
      expect(change.c.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.c.type).toEqual('INPUT_FIELD_TYPE_CHANGED');
      expect(change.c.message).toEqual(
        "Input field 'Foo.c' changed type from '[String]!' to '[String!]!'",
      );
    });
  });

  test('removal of a deprecated field', async () => {
    const a = buildSchema(/* GraphQL */ `
      input Foo {
        a: String
        b: String
        c: String @deprecated(reason: "Can be removed, but clients must be updated too")
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      input Foo {
        a: String
        b: String
      }
    `);

    const changes = await diff(a, b);
    const change = findFirstChangeByPath(changes, 'Foo.c');

    expect(changes.length).toEqual(1);
    expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
    expect(change.message).toEqual(
      `Input field 'c' (deprecated) was removed from input object type 'Foo'`,
    );

    // suppressRemovalOfDeprecatedField rule should make it only Dangerous

    const changesWithRule = await diff(a, b, [DiffRule.suppressRemovalOfDeprecatedField]);
    const changeWithRule = findFirstChangeByPath(changesWithRule, 'Foo.c');

    expect(changesWithRule.length).toEqual(1);
    expect(changeWithRule.criticality.level).toEqual(CriticalityLevel.Dangerous);
    expect(changeWithRule.message).toEqual(
      "Input field 'c' (deprecated) was removed from input object type 'Foo'",
    );
  });
});
