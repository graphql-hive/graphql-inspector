import { buildSchema } from 'graphql';
import { CriticalityLevel, diff } from '../../src/index.js';
import { findFirstChangeByPath } from '../../utils/testing.js';

describe('directive-usage', () => {
  describe('field-level directives', () => {
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on FIELD_DEFINITION

        type Query {
          a: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on FIELD_DEFINITION

        type Query {
          a: String @external
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Query.a.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_FIELD_DEFINITION_ADDED');
      expect(change.message).toEqual("Directive 'external' was added to field 'Query.a'");
    });

    test('removed directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on FIELD_DEFINITION

        type Query {
          a: String @external
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on FIELD_DEFINITION

        type Query {
          a: String
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Query.a.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_FIELD_DEFINITION_REMOVED');
      expect(change.message).toEqual("Directive 'external' was removed from field 'Query.a'");
    });

    test('added oneOf directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @oneOf on FIELD_DEFINITION

        type Query {
          a: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @oneOf on FIELD_DEFINITION

        type Query {
          a: String @oneOf
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Query.a.oneOf');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('DIRECTIVE_USAGE_FIELD_DEFINITION_ADDED');
      expect(change.message).toEqual("Directive 'oneOf' was added to field 'Query.a'");
    });

    test('removed oneOf directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @oneOf on FIELD_DEFINITION

        type Query {
          a: String @oneOf
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @oneOf on FIELD_DEFINITION

        type Query {
          a: String
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Query.a.oneOf');

      expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.type).toEqual('DIRECTIVE_USAGE_FIELD_DEFINITION_REMOVED');
      expect(change.message).toEqual("Directive 'oneOf' was removed from field 'Query.a'");
    });
  });

  describe('union-level directives', () => {
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on UNION

        type A {
          a: String!
        }

        type B {
          b: String!
        }

        union Foo = A | B
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on UNION

        type A {
          a: String!
        }

        type B {
          b: String!
        }

        union Foo @external = A | B
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Foo.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_UNION_MEMBER_ADDED');
      expect(change.message).toEqual("Directive 'external' was added to union member 'Foo'");
    });

    test('remove directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on UNION

        type A {
          a: String!
        }

        type B {
          b: String!
        }

        union Foo @external = A | B
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on UNION

        type A {
          a: String!
        }

        type B {
          b: String!
        }

        union Foo = A | B
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_UNION_MEMBER_REMOVED');
      expect(change.message).toEqual("Directive 'external' was removed from union member 'Foo'");
    });

    test('added oneOf directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @oneOf on UNION

        type A {
          a: String!
        }

        type B {
          b: String!
        }

        union Foo = A | B
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @oneOf on UNION

        type A {
          a: String!
        }

        type B {
          b: String!
        }

        union Foo @oneOf = A | B
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'Foo.oneOf');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('DIRECTIVE_USAGE_UNION_MEMBER_ADDED');
      expect(change.message).toEqual("Directive 'oneOf' was added to union member 'Foo'");
    });

    test('removed oneOf directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @oneOf on UNION

        type A {
          a: String!
        }

        type B {
          b: String!
        }

        union Foo @oneOf = A | B
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @oneOf on UNION

        type A {
          a: String!
        }

        type B {
          b: String!
        }

        union Foo = A | B
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.oneOf');

      expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.type).toEqual('DIRECTIVE_USAGE_UNION_MEMBER_REMOVED');
      expect(change.message).toEqual("Directive 'oneOf' was removed from union member 'Foo'");
    });
  });

  describe('enum-level directives', () => {
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on ENUM
        type Query {
          fieldA: String
        }

        enum enumA {
          A
          B
        }
      `);

      const b = buildSchema(/* GraphQL */ `
        directive @external on ENUM
        type Query {
          fieldA: String
        }

        enum enumA @external {
          A
          B
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'enumA.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.criticality.reason).toBeDefined();
      expect(change.message).toEqual(`Directive 'external' was added to enum 'enumA'`);
    });

    test('removed directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on ENUM
        type Query {
          fieldA: String
        }

        enum enumA @external {
          A
          B
        }
      `);

      const b = buildSchema(/* GraphQL */ `
        directive @external on ENUM
        type Query {
          fieldA: String
        }

        enum enumA {
          A
          B
        }
      `);

      const change = findFirstChangeByPath(await diff(a, b), 'enumA.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_ENUM_REMOVED');
      expect(change.message).toEqual("Directive 'external' was removed from enum 'enumA'");
    });
  });

  describe('enum-value-level directives', () => {
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on ENUM_VALUE
        type Query {
          fieldA: String
        }

        enum enumA {
          A
          B
        }
      `);

      const b = buildSchema(/* GraphQL */ `
        directive @external on ENUM_VALUE

        type Query {
          fieldA: String
        }

        enum enumA {
          A
          B @external
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'enumA.B.external');

      expect(changes.length).toEqual(1);
      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.criticality.reason).toBeDefined();
      expect(change.message).toEqual(`Directive 'external' was added to enum value 'enumA.B'`);
    });

    test('removed directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on ENUM_VALUE
        type Query {
          fieldA: String
        }

        enum enumA {
          A
          B
        }
      `);

      const b = buildSchema(/* GraphQL */ `
        directive @external on ENUM_VALUE

        type Query {
          fieldA: String
        }

        enum enumA {
          A @external
          B
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'enumA.A.external');

      expect(changes.length).toEqual(1);
      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.criticality.reason).toBeDefined();
      expect(change.message).toEqual(`Directive 'external' was added to enum value 'enumA.A'`);
    });
  });

  describe('input-object-level directives', () => {
    test('removed directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on INPUT_OBJECT
        input Foo @external {
          a: String
          b: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on INPUT_OBJECT
        input Foo {
          a: String
          b: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(changes.length).toEqual(1);
      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_INPUT_OBJECT_REMOVED');
      expect(change.message).toEqual("Directive 'external' was removed from input object 'Foo'");
    });
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on INPUT_OBJECT
        input Foo {
          a: String
          b: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on INPUT_OBJECT
        input Foo @external {
          a: String
          b: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(changes.length).toEqual(1);
      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_INPUT_OBJECT_ADDED');
      expect(change.message).toEqual("Directive 'external' was added to input object 'Foo'");
    });
  });

  describe('input-field-level directives', () => {
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on INPUT_FIELD_DEFINITION
        input Foo {
          a: String
          b: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on INPUT_FIELD_DEFINITION
        input Foo {
          a: String @external
          b: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.a.external');

      expect(changes.length).toEqual(1);
      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_ADDED');
      expect(change.message).toEqual(
        "Directive 'external' was added to input field 'a' in input object 'Foo'",
      );
    });
    test('removed directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on INPUT_FIELD_DEFINITION
        input Foo {
          a: String @external
          b: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on INPUT_FIELD_DEFINITION
        input Foo {
          a: String
          b: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.a.external');

      expect(changes.length).toEqual(1);
      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_REMOVED');
      expect(change.message).toEqual(
        "Directive 'external' was removed from input field 'a' in input object 'Foo'",
      );
    });
  });

  describe('scalar-level directives', () => {
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on SCALAR
        scalar Foo
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on SCALAR
        scalar Foo @external
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(changes.length).toEqual(1);
      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_SCALAR_ADDED');
      expect(change.message).toEqual("Directive 'external' was added to scalar 'Foo'");
    });
    test('removed directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on SCALAR
        scalar Foo @external
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on SCALAR
        scalar Foo
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(changes.length).toEqual(1);
      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('DIRECTIVE_USAGE_SCALAR_REMOVED');
      expect(change.message).toEqual("Directive 'external' was removed from scalar 'Foo'");
    });
  });

  describe('object-level directives', () => {
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on OBJECT
        type Foo {
          a: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on OBJECT
        type Foo @external {
          a: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_OBJECT_ADDED');
      expect(change.message).toEqual("Directive 'external' was added to object 'Foo'");
    });
    test('removed directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on OBJECT
        type Foo @external {
          a: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on OBJECT
        type Foo {
          a: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_OBJECT_REMOVED');
      expect(change.message).toEqual("Directive 'external' was removed from object 'Foo'");
    });
  });

  describe('interface-level directives', () => {
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on INTERFACE
        interface Foo {
          a: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on INTERFACE
        interface Foo @external {
          a: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_INTERFACE_ADDED');
      expect(change.message).toEqual("Directive 'external' was added to interface 'Foo'");
    });

    test('removed directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on INTERFACE
        interface Foo @external {
          a: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on INTERFACE
        interface Foo {
          a: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('DIRECTIVE_USAGE_INTERFACE_REMOVED');
      expect(change.message).toEqual("Directive 'external' was removed from interface 'Foo'");
    });
  });

  describe('argument-definition directives', () => {
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on ARGUMENT_DEFINITION
        type Foo {
          a(a: String): String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on ARGUMENT_DEFINITION
        type Foo {
          a(a: String @external): String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.a.a.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_ARGUMENT_DEFINITION_ADDED');
      expect(change.message).toEqual(
        "Directive 'external' was added to argument 'a' of field 'a' in type 'Foo'",
      );
    });

    test('removed directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on ARGUMENT_DEFINITION
        type Foo {
          a(a: String @external): String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on ARGUMENT_DEFINITION
        type Foo {
          a(a: String): String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.a.a.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_ARGUMENT_DEFINITION_REMOVED');
      expect(change.message).toEqual(
        "Directive 'external' was removed from argument 'a' of field 'a' in type 'Foo'",
      );
    });
  });

  describe('schema directives', () => {
    test('added directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on SCHEMA
        schema {
          query: Foo
        }
        type Foo {
          a(a: String): String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on SCHEMA
        schema @external {
          query: Foo
        }
        type Foo {
          a(a: String): String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_SCHEMA_ADDED');
      expect(change.message).toEqual("Directive 'external' was added to schema 'Foo'");
    });
    test('removed directive', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @external on SCHEMA
        schema @external {
          query: Foo
        }
        type Foo {
          a(a: String): String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @external on SCHEMA
        schema {
          query: Foo
        }
        type Foo {
          a(a: String): String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, 'Foo.external');

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_USAGE_SCHEMA_REMOVED');
      expect(change.message).toEqual("Directive 'external' was removed from schema 'Foo'");
    });
  });
});
