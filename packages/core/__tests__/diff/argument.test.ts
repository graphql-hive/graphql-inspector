import { buildSchema } from 'graphql';
import { CriticalityLevel, diff } from '../../src/index.js';
import { findChangesByPath, findFirstChangeByPath } from '../../utils/testing.js';

describe('argument', () => {
  test('argument deprecation reason changed / added / removed', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        f(
          a: String! @deprecated(reason: "OLD"),
          b: String! @deprecated(reason: "BBB"),
          c: String!
        ): String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Query {
        f(
          a: String! @deprecated(reason: "NEW"),
          b: String!,
          c: String! @deprecated(reason: "CCC")
        ): String
      }
    `);

    const changes = await diff(a, b);
    const change = {
      a: findFirstChangeByPath(changes, 'Query.f.a.@deprecated'),
      b: findFirstChangeByPath(changes, 'Query.f.b.@deprecated'),
      c: findFirstChangeByPath(changes, 'Query.f.c.@deprecated'),
    };

    expect(change.a.type).toEqual('FIELD_ARGUMENT_DEPRECATION_REASON_CHANGED');
    expect(change.a.message).toEqual(
      "Deprecation reason on argument 'a' on field 'Query.f' has changed from 'OLD' to 'NEW'",
    );
    expect(change.b.type).toEqual('FIELD_ARGUMENT_DEPRECATION_REMOVED');
    expect(change.b.message).toEqual("Argument 'b' on field 'Query.f' is no longer deprecated");
    expect(change.c.type).toEqual('FIELD_ARGUMENT_DEPRECATION_ADDED');
    expect(change.c.message).toEqual("Argument 'c' on field 'Query.f' is deprecated");
  });

  test('argument deprecation added / removed', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        f(a: String! @deprecated, b: String!): String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Query {
        f(a: String!, b: String! @deprecated): String
      }
    `);

    const changes = await diff(a, b);
    const change = {
      a: findFirstChangeByPath(changes, 'Query.f.a.@deprecated'),
      b: findFirstChangeByPath(changes, 'Query.f.b.@deprecated'),
    };

    expect(change.a.type).toEqual('FIELD_ARGUMENT_DEPRECATION_REMOVED');
    expect(change.a.message).toEqual("Argument 'a' on field 'Query.f' is no longer deprecated");
    expect(change.b.type).toEqual('FIELD_ARGUMENT_DEPRECATION_ADDED');
    expect(change.b.message).toEqual("Argument 'b' on field 'Query.f' is deprecated");
  });

  test('argument deprecation added w/reason', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        f(a: String!): String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Query {
        f(a: String! @deprecated(reason: "unused")): String
      }
    `);

    const changes = await diff(a, b);
    expect(findChangesByPath(changes, 'Query.f.a.@deprecated')).toHaveLength(2);
    const change = findFirstChangeByPath(changes, 'Query.f.a.@deprecated');
    expect(change.type).toEqual('FIELD_ARGUMENT_DEPRECATION_ADDED');
    expect(change.meta).toMatchObject({
      argumentName: 'a',
      deprecationReason: 'unused',
      fieldName: 'f',
      typeName: 'Query',
    });
  });

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
  });
});
