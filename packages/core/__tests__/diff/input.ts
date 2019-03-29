import {buildSchema} from 'graphql';

import {diff, CriticalityLevel} from '../../src/index';
import {findFirstChangeByPath} from '../../utils/testing';

describe('input', () => {
  describe('fields', () => {
    test('added', () => {
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
        }
      `);

      const change = {
        c: findFirstChangeByPath(diff(a, b), 'Foo.c'),
        d: findFirstChangeByPath(diff(a, b), 'Foo.d'),
      };

      // Non-nullable
      expect(change.c.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.c.type).toEqual('INPUT_FIELD_ADDED');
      expect(change.c.message).toEqual(
        "Input field 'c' was added to input object type 'Foo'",
      );
      // Nullable
      expect(change.d.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.d.type).toEqual('INPUT_FIELD_ADDED');
      expect(change.d.message).toEqual(
        "Input field 'd' was added to input object type 'Foo'",
      );
    });
    test('removed', () => {
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

      const change = findFirstChangeByPath(diff(a, b), 'Foo.c');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('INPUT_FIELD_REMOVED');
      expect(change.message).toEqual(
        "Input field 'c' was removed from input object type 'Foo'",
      );
    });

    test('order changed', () => {
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

      expect(diff(a, b)).toHaveLength(0);
    });

    test('type changed', () => {
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

      const changes = diff(a, b);
      const change = {
        a: findFirstChangeByPath(changes, 'Foo.a'),
        b: findFirstChangeByPath(changes, 'Foo.b'),
        c: findFirstChangeByPath(changes, 'Foo.c'),
      };

      // Whole new type
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.a.type).toEqual('INPUT_FIELD_TYPE_CHANGED');
      expect(change.a.message).toEqual(
        "Input field 'Foo.a' changed type from 'String!' to 'Int!'",
      );
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

    test('description changed / added / removed', () => {
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

      const changes = diff(a, b);
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
      expect(change.b.message).toEqual(
        "Description was removed from input field 'Foo.b'",
      );
      // Added
      expect(change.c.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.c.type).toEqual('INPUT_FIELD_DESCRIPTION_ADDED');
      expect(change.c.message).toEqual(
        "Input field 'Foo.c' has description 'CCC'",
      );
    });

    test('default value added', () => {
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
        a: findFirstChangeByPath(diff(a, b), 'Foo.a'),
        b: findFirstChangeByPath(diff(a, b), 'Foo.b'),
      };

      // Non-nullable
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.a.type).toEqual('INPUT_FIELD_DEFAULT_VALUE_CHANGED');
      expect(change.a.message).toEqual(
        "Input field 'Foo.a' default value changed from 'undefined' to 'Aaa'",
      );
      // Nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.b.type).toEqual('INPUT_FIELD_DEFAULT_VALUE_CHANGED');
      expect(change.b.message).toEqual(
        "Input field 'Foo.b' default value changed from 'undefined' to 'Bbb'",
      );
    });

    test('default value removed', () => {
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
        a: findFirstChangeByPath(diff(a, b), 'Foo.a'),
        b: findFirstChangeByPath(diff(a, b), 'Foo.b'),
      };

      // Non-nullable
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.a.type).toEqual('INPUT_FIELD_DEFAULT_VALUE_CHANGED');
      expect(change.a.message).toEqual(
        "Input field 'Foo.a' default value changed from 'Aaa' to 'undefined'",
      );
      // Nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.b.type).toEqual('INPUT_FIELD_DEFAULT_VALUE_CHANGED');
      expect(change.b.message).toEqual(
        "Input field 'Foo.b' default value changed from 'Bbb' to 'undefined'",
      );
    });
    test('field removed', () => {
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

      const change = findFirstChangeByPath(diff(a, b), 'Foo.c');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('INPUT_FIELD_REMOVED');
      expect(change.message).toEqual(
        "Input field 'c' was removed from input object type 'Foo'",
      );
    });
  });
});
