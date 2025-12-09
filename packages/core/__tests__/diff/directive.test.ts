import { buildSchema } from 'graphql';
import { CriticalityLevel, diff } from '../../src/index.js';
import { findFirstChangeByPath } from '../../utils/testing.js';

describe('directive', () => {
  test('added', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Dummy {
        field: String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      directive @foo on FIELD

      type Dummy {
        field: String
      }
    `);

    const change = findFirstChangeByPath(await diff(a, b), '@foo');

    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.type).toEqual('DIRECTIVE_ADDED');
    expect(change.message).toEqual(`Directive 'foo' was added`);
  });
  test('removed', async () => {
    const a = buildSchema(/* GraphQL */ `
      directive @foo on FIELD

      type Dummy {
        field: String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      type Dummy {
        field: String
      }
    `);

    const change = findFirstChangeByPath(await diff(a, b), '@foo');

    expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
    expect(change.type).toEqual('DIRECTIVE_REMOVED');
    expect(change.message).toEqual(`Directive 'foo' was removed`);
  });

  test('description', async () => {
    const a = buildSchema(/* GraphQL */ `
      """
      AAA
      """
      directive @a on FIELD
      directive @b on FIELD
      """
      Ccc
      """
      directive @c on FIELD

      type Dummy {
        field: String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      """
      aaa
      """
      directive @a on FIELD
      """
      Bbb
      """
      directive @b on FIELD
      directive @c on FIELD

      type Dummy {
        field: String
      }
    `);

    const changes = await diff(a, b);
    const change = {
      a: findFirstChangeByPath(changes, '@a'),
      b: findFirstChangeByPath(changes, '@b'),
      c: findFirstChangeByPath(changes, '@c'),
    };

    // changed
    expect(change.a.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.a.type).toEqual('DIRECTIVE_DESCRIPTION_CHANGED');
    expect(change.a.message).toEqual(`Directive 'a' description changed from 'AAA' to 'aaa'`);
    // added
    expect(change.b.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.b.type).toEqual('DIRECTIVE_DESCRIPTION_CHANGED');
    expect(change.b.message).toEqual(`Directive 'b' description 'Bbb' was added`);
    // removed
    expect(change.c.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.c.type).toEqual('DIRECTIVE_DESCRIPTION_CHANGED');
    expect(change.c.message).toEqual(`Directive 'c' description 'Ccc' was removed`);
  });

  describe('location', () => {
    test('added', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @a on FIELD

        type Dummy {
          field: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @a on FIELD | ENUM_VALUE

        type Dummy {
          field: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, '@a');

      expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.type).toEqual('DIRECTIVE_LOCATION_ADDED');
      expect(change.message).toEqual(`Location 'ENUM_VALUE' was added to directive 'a'`);
    });

    test('removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @a on FIELD | ENUM_VALUE

        type Dummy {
          field: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @a on FIELD

        type Dummy {
          field: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, '@a');

      expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.type).toEqual('DIRECTIVE_LOCATION_REMOVED');
      expect(change.message).toEqual(`Location 'ENUM_VALUE' was removed from directive 'a'`);
    });
  });

  describe('arguments', () => {
    test('added', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @a on FIELD
        directive @b on FIELD

        type Dummy {
          field: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @a(name: String) on FIELD
        directive @b(name: String!) on FIELD

        type Dummy {
          field: String
        }
      `);

      const changes = await diff(a, b);
      const change = {
        a: findFirstChangeByPath(changes, '@a'),
        b: findFirstChangeByPath(changes, '@b'),
      };

      // Nullable
      expect(change.a?.type).toEqual('DIRECTIVE_ARGUMENT_ADDED');
      expect(change.a?.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.a?.message).toEqual(`Argument 'name' was added to directive 'a'`);
      // Non-nullable
      expect(change.b?.type).toEqual('DIRECTIVE_ARGUMENT_ADDED');
      expect(change.b?.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.b?.message).toEqual(`Argument 'name' was added to directive 'b'`);
    });

    test('removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @a(name: String) on FIELD
        directive @b(name: String!) on FIELD

        type Dummy {
          field: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @a on FIELD
        directive @b on FIELD

        type Dummy {
          field: String
        }
      `);

      const changes = await diff(a, b);
      const change = {
        a: findFirstChangeByPath(changes, '@a.name'),
        b: findFirstChangeByPath(changes, '@b.name'),
      };

      // Nullable
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.a.type).toEqual('DIRECTIVE_ARGUMENT_REMOVED');
      expect(change.a.message).toEqual(`Argument 'name' was removed from directive 'a'`);
      // Non-nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.b.type).toEqual('DIRECTIVE_ARGUMENT_REMOVED');
      expect(change.b.message).toEqual(`Argument 'name' was removed from directive 'b'`);
    });

    test('changed', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @a(name: String) on FIELD
        directive @b(name: String!) on FIELD
        directive @c(name: String) on FIELD

        type Dummy {
          field: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @a(name: Int) on FIELD
        directive @b(name: String) on FIELD
        directive @c(name: String!) on FIELD

        type Dummy {
          field: String
        }
      `);

      const changes = await diff(a, b);
      const change = {
        a: findFirstChangeByPath(changes, '@a.name'),
        b: findFirstChangeByPath(changes, '@b.name'),
        c: findFirstChangeByPath(changes, '@c.name'),
      };

      // Type
      expect(change.a.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.a.type).toEqual('DIRECTIVE_ARGUMENT_TYPE_CHANGED');
      expect(change.a.message).toEqual(
        `Type for argument 'name' on directive 'a' changed from 'String' to 'Int'`,
      );
      // Non-nullable
      expect(change.b.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.b.type).toEqual('DIRECTIVE_ARGUMENT_TYPE_CHANGED');
      expect(change.b.message).toEqual(
        `Type for argument 'name' on directive 'b' changed from 'String!' to 'String'`,
      );
      // Nullable
      expect(change.c.criticality.level).toEqual(CriticalityLevel.Breaking);
      expect(change.c.type).toEqual('DIRECTIVE_ARGUMENT_TYPE_CHANGED');
      expect(change.c.message).toEqual(
        `Type for argument 'name' on directive 'c' changed from 'String' to 'String!'`,
      );
    });
  });

  test('default value', async () => {
    const a = buildSchema(/* GraphQL */ `
      directive @a(name: String! = "aaa") on FIELD
      directive @b(name: String) on FIELD
      directive @c(name: String!) on FIELD
      directive @d(name: String! = "Ddd") on FIELD
      directive @e(name: String = "Eee") on FIELD

      type Dummy {
        field: String
      }
    `);
    const b = buildSchema(/* GraphQL */ `
      directive @a(name: String! = "AAA") on FIELD
      directive @b(name: String = "Bbb") on FIELD
      directive @c(name: String! = "Ccc") on FIELD
      directive @d(name: String!) on FIELD
      directive @e(name: String) on FIELD

      type Dummy {
        field: String
      }
    `);

    const changes = await diff(a, b);
    const change = {
      a: findFirstChangeByPath(changes, '@a.name'),
      b: findFirstChangeByPath(changes, '@b.name'),
      c: findFirstChangeByPath(changes, '@c.name'),
      d: findFirstChangeByPath(changes, '@d.name'),
      e: findFirstChangeByPath(changes, '@e.name'),
    };

    // changed
    expect(change.a.criticality.level).toEqual(CriticalityLevel.Dangerous);
    expect(change.a.type).toEqual('DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED');
    expect(change.a.message).toEqual(
      `Default value for argument 'name' on directive 'a' changed from '"aaa"' to '"AAA"'`,
    );
    // added on nullable
    expect(change.b.criticality.level).toEqual(CriticalityLevel.Dangerous);
    expect(change.b.type).toEqual('DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED');
    expect(change.b.message).toEqual(
      `Default value '"Bbb"' was added to argument 'name' on directive 'b'`,
    );
    // added on non-nullable
    expect(change.c.criticality.level).toEqual(CriticalityLevel.Dangerous);
    expect(change.c.type).toEqual('DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED');
    expect(change.c.message).toEqual(
      `Default value '"Ccc"' was added to argument 'name' on directive 'c'`,
    );
    // removed from non-nullable
    expect(change.d.criticality.level).toEqual(CriticalityLevel.Dangerous);
    expect(change.d.type).toEqual('DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED');
    expect(change.d.message).toEqual(
      `Default value for argument 'name' on directive 'd' changed from '"Ddd"' to 'undefined'`,
    );
    // removed from nullable
    expect(change.e.criticality.level).toEqual(CriticalityLevel.Dangerous);
    expect(change.e.type).toEqual('DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED');
    expect(change.e.message).toEqual(
      `Default value for argument 'name' on directive 'e' changed from '"Eee"' to 'undefined'`,
    );
  });

  describe('repeatable', async () => {
    test('added', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @a on FIELD

        type Dummy {
          field: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @a repeatable on FIELD

        type Dummy {
          field: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, '@a');

      expect(changes).toHaveLength(1);

      expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.type).toEqual('DIRECTIVE_REPEATABLE_ADDED');
      expect(change.message).toEqual("Directive 'a' added repeatable.");
    });

    test('removed', async () => {
      const a = buildSchema(/* GraphQL */ `
        directive @a repeatable on FIELD

        type Dummy {
          field: String
        }
      `);
      const b = buildSchema(/* GraphQL */ `
        directive @a on FIELD

        type Dummy {
          field: String
        }
      `);

      const changes = await diff(a, b);
      const change = findFirstChangeByPath(changes, '@a');

      expect(changes).toHaveLength(1);

      expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
      expect(change.type).toEqual('DIRECTIVE_REPEATABLE_REMOVED');
      expect(change.message).toEqual("Directive 'a' removed repeatable.");
    });

    test('complex remove', async () => {
      const before = buildSchema(/* GraphQL */ `
        directive @flavor(flavor: String!) repeatable on OBJECT
        type Pancake @flavor(flavor: "bread") {
          radius: Int!
        }
      `);
      const after = buildSchema(/* GraphQL */ `
        directive @flavor(flavor: String!) repeatable on OBJECT
        type Pancake
          @flavor(flavor: "sweet")
          @flavor(flavor: "bread")
          @flavor(flavor: "chocolate")
          @flavor(flavor: "strawberry") {
          radius: Int!
        }
      `);
      const changes = await diff(before, after);
      expect(changes.map(c => `[${c.criticality.level}] ${c.path}: ${c.message}`))
        .toMatchInlineSnapshot(`
        [
          "[DANGEROUS] Pancake.@flavor: Directive 'flavor' was added to object 'Pancake'",
          "[NON_BREAKING] Pancake.@flavor.flavor: Argument 'flavor' was added to '@flavor'",
          "[DANGEROUS] Pancake.@flavor: Directive 'flavor' was added to object 'Pancake'",
          "[NON_BREAKING] Pancake.@flavor.flavor: Argument 'flavor' was added to '@flavor'",
          "[DANGEROUS] Pancake.@flavor: Directive 'flavor' was added to object 'Pancake'",
          "[NON_BREAKING] Pancake.@flavor.flavor: Argument 'flavor' was added to '@flavor'",
          "[DANGEROUS] Pancake.@flavor.flavor: Argument 'flavor' was removed from '@flavor'",
          "[NON_BREAKING] Pancake.@flavor.flavor: Argument 'flavor' was added to '@flavor'",
        ]
      `);
    });
  });
});
