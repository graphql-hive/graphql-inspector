import { buildSchema } from 'graphql';
import { CriticalityLevel, diff } from '../../src/index.js';
import { findFirstChangeByPath } from '../../utils/testing.js';

describe('argument', () => {
  test('added non-nullable with default value', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        a: String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Query {
        a(b: Boolean! = true): String
      }
    `);

    const change = findFirstChangeByPath(await diff(a, b), 'Query.a.b');

    expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
    expect(change.type).toEqual('FIELD_ARGUMENT_ADDED');
    expect(change.message).toEqual(
      "Argument 'b: Boolean!' (with default value) added to field 'Query.a'",
    );
  });

  describe('default value', () => {
    test('added', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
        }

        type Dummy {
          field(foo: Foo): String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
        }

        type Dummy {
          field(foo: Foo = { a: "a" }): String
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Dummy.field.foo');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('FIELD_ARGUMENT_DEFAULT_CHANGED');
      expect(change.message).toEqual(
        `Default value '{ a: "a" }' was added to argument 'foo' on field 'Dummy.field'`,
      );
    });

    test('changed', async () => {
      const a = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
        }

        type Dummy {
          field(foo: Foo = { a: "a" }): String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        input Foo {
          a: String!
        }

        type Dummy {
          field(foo: Foo = { a: "new-value" }): String
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Dummy.field.foo');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('FIELD_ARGUMENT_DEFAULT_CHANGED');
      expect(change.message).toEqual(
        `Default value for argument 'foo' on field 'Dummy.field' changed from '{ a: "a" }' to '{ a: "new-value" }'`,
      );
    });
  });
});
