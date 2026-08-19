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
        "Default value '{ a: 'a' }' was added to argument 'foo' on field 'Dummy.field'",
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
        "Default value for argument 'foo' on field 'Dummy.field' changed from '{ a: 'a' }' to '{ a: 'new-value' }'",
      );
    });

    test('supports programmatic default values', async () => {
      const a = buildSchema('type Query { field(value: String): String }');
      const b = buildSchema('type Query { field(value: String): String }');
      a.getQueryType()!.getFields().field.args[0].default = { value: 'old' };
      b.getQueryType()!.getFields().field.args[0].default = { value: 'new' };

      const change = findFirstChangeByPath(await diff(a, b), 'Query.field.value');

      expect(change.type).toEqual('FIELD_ARGUMENT_DEFAULT_CHANGED');
      expect(change.message).toEqual(
        `Default value for argument 'value' on field 'Query.field' changed from '"old"' to '"new"'`,
      );
    });

    test('supports legacy defaultValue with GraphQL 17', async () => {
      const a = buildSchema('type Query { field(value: String): String }');
      const b = buildSchema('type Query { field(value: String): String }');
      a.getQueryType()!.getFields().field.args[0].defaultValue = 'old';
      b.getQueryType()!.getFields().field.args[0].defaultValue = 'new';

      const change = findFirstChangeByPath(await diff(a, b), 'Query.field.value');

      expect(change.message).toContain(`changed from '"old"' to '"new"'`);
    });

    test('treats equivalent literal and programmatic defaults as equal', async () => {
      const a = buildSchema('type Query { field(value: String = "same"): String }');
      const b = buildSchema('type Query { field(value: String): String }');
      b.getQueryType()!.getFields().field.args[0].default = { value: 'same' };

      const changes = await diff(a, b);

      expect(changes).not.toContainEqual(
        expect.objectContaining({ type: 'FIELD_ARGUMENT_DEFAULT_CHANGED' }),
      );
    });

    test('detects removal of a falsy default', async () => {
      const a = buildSchema('type Query { field(value: Boolean): String }');
      const b = buildSchema('type Query { field(value: Boolean): String }');
      a.getQueryType()!.getFields().field.args[0].default = { value: false };

      const change = findFirstChangeByPath(await diff(a, b), 'Query.field.value');

      expect(change.type).toEqual('FIELD_ARGUMENT_DEFAULT_CHANGED');
      expect(change.meta.oldDefaultValue).toBe('false');
      expect(change.meta.newDefaultValue).toBeUndefined();
    });
  });
});
