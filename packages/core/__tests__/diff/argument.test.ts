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
    expect(change.criticality.reason).toEqual(
      'Adding an argument with a default value to an existing field may change the runtime behaviour of the field for existing queries that do not provide it, as they now receive the default value.',
    );
    expect(change.type).toEqual('FIELD_ARGUMENT_ADDED');
    expect(change.message).toEqual(
      "Argument 'Query.a(b:)' of type 'Boolean!' (with default value) was added",
    );
  });

  test('added non-nullable without default value', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        a: String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Query {
        a(b: Boolean!): String
      }
    `);

    const change = findFirstChangeByPath(await diff(a, b), 'Query.a.b');

    expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
    expect(change.criticality.reason).toEqual(
      'Adding a non-null argument without a default value to an existing field will cause existing queries that do not provide it to error.',
    );
    expect(change.type).toEqual('FIELD_ARGUMENT_ADDED');
    expect(change.message).toEqual("Argument 'Query.a(b:)' of type 'Boolean!' was added");
  });

  test('added nullable with default value', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        a: String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Query {
        a(b: Boolean = true): String
      }
    `);

    const change = findFirstChangeByPath(await diff(a, b), 'Query.a.b');

    expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
    expect(change.criticality.reason).toEqual(
      'Adding an argument with a default value to an existing field may change the runtime behaviour of the field for existing queries that do not provide it, as they now receive the default value.',
    );
    expect(change.type).toEqual('FIELD_ARGUMENT_ADDED');
    expect(change.message).toEqual(
      "Argument 'Query.a(b:)' of type 'Boolean' (with default value) was added",
    );
  });

  test('added nullable without default value', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        a: String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Query {
        a(b: Boolean): String
      }
    `);

    const change = findFirstChangeByPath(await diff(a, b), 'Query.a.b');

    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.criticality.reason).toEqual(
      'Adding a nullable argument without a default value to an existing field does not affect existing queries: they remain valid and the field receives no value for it.',
    );
    expect(change.type).toEqual('FIELD_ARGUMENT_ADDED');
    expect(change.message).toEqual("Argument 'Query.a(b:)' of type 'Boolean' was added");
  });

  test('added to a new field', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        a: String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Query {
        a: String
        c(b: Boolean!): String
      }
    `);

    const change = findFirstChangeByPath(await diff(a, b), 'Query.c.b');

    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.criticality.reason).toEqual('The field is new, so no existing query uses it.');
    expect(change.type).toEqual('FIELD_ARGUMENT_ADDED');
    expect(change.message).toEqual("Argument 'Query.c(b:)' of type 'Boolean!' was added");
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
        "Argument 'Dummy.field(foo:)' default value '{ a: 'a' }' was added",
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
        "Argument 'Dummy.field(foo:)' default value changed from '{ a: 'a' }' to '{ a: 'new-value' }'",
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
        `Argument 'Query.field(value:)' default value changed from '"old"' to '"new"'`,
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

  describe('default value', () => {
    test('unchanged scalar and enum defaults report no change', async () => {
      const sdl = /* GraphQL */ `
        enum Sort {
          ASC
          DESC
        }
        type Query {
          a(first: Int = 10, sort: Sort = ASC, tags: [String!] = ["x"]): String
        }
      `;
      expect(await diff(buildSchema(sdl), buildSchema(sdl))).toEqual([]);
    });

    test('changed scalar default is reported', async () => {
      const a = buildSchema(/* GraphQL */ `
        type Query {
          a(first: Int = 10): String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        type Query {
          a(first: Int = 11): String
        }
      `);
      const changes = await diff(a, b);
      expect(changes.map(c => c.type)).toEqual(['FIELD_ARGUMENT_DEFAULT_CHANGED']);
    });

    test('changed input object default is reported', async () => {
      const sdl = (value: number) => /* GraphQL */ `
        input Filter {
          limit: Int
        }
        type Query {
          a(filter: Filter = { limit: ${value} }): String
        }
      `;
      const changes = await diff(buildSchema(sdl(1)), buildSchema(sdl(2)));
      expect(changes.map(c => c.type)).toEqual(['FIELD_ARGUMENT_DEFAULT_CHANGED']);
    });

    test('changed nested input field default is reported on the argument', async () => {
      const sdl = (value: number) => /* GraphQL */ `
        input Filter {
          limit: Int = ${value}
        }
        type Query {
          a(filter: Filter = {}): String
        }
      `;
      const changes = await diff(buildSchema(sdl(1)), buildSchema(sdl(2)));
      expect(changes.map(c => `${c.path} ${c.type}`).sort()).toEqual([
        'Filter.limit INPUT_FIELD_DEFAULT_VALUE_CHANGED',
        'Query.a.filter FIELD_ARGUMENT_DEFAULT_CHANGED',
      ]);
    });
  });
});
