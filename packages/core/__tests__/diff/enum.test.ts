import { buildSchema } from 'graphql';
import { ChangeType, CriticalityLevel, diff, DiffRule } from '../../src/index.js';
import { findChangesByPath, findFirstChangeByPath } from '../../utils/testing.js';

describe('enum', () => {
  test('added', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        """
        A is the first letter in the alphabet
        """
        A
        B
      }
    `);

    const changes = await diff(a, b);
    expect(changes.length).toEqual(4);

    {
      const change = findFirstChangeByPath(changes, 'enumA');
      expect(change.meta).toMatchObject({
        addedTypeKind: 'EnumTypeDefinition',
        addedTypeName: 'enumA',
      });
      expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.criticality.reason).not.toBeDefined();
      expect(change.message).toEqual(`Type 'enumA' was added`);
    }

    {
      const change = findFirstChangeByPath(changes, 'enumA.A');
      expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      expect(change.criticality.reason).not.toBeDefined();
      expect(change.message).toEqual(`Enum value 'A' was added to enum 'enumA'`);
      expect(change.meta).toMatchObject({
        addedEnumValueName: 'A',
        enumName: 'enumA',
        addedToNewType: true,
      });
    }
  });

  test('value added', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A
        B
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A
        B
        C
      }
    `);

    const changes = await diff(a, b);
    const change = findFirstChangeByPath(changes, 'enumA.C');

    expect(changes.length).toEqual(1);
    expect(change.criticality.level).toEqual(CriticalityLevel.Dangerous);
    expect(change.criticality.reason).toBeDefined();
    expect(change.message).toEqual(`Enum value 'C' was added to enum 'enumA'`);
  });

  test('value removed', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A
        B
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A
      }
    `);

    const changes = await diff(a, b);
    const change = findFirstChangeByPath(changes, 'enumA.B');

    expect(changes.length).toEqual(1);
    expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
    expect(change.criticality.reason).toBeDefined();
    expect(change.message).toEqual(`Enum value 'B' was removed from enum 'enumA'`);
  });

  test('description changed', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      """
      Old Description
      """
      enum enumA {
        A
        B
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      """
      New Description
      """
      enum enumA {
        A
        B
      }
    `);

    const changes = await diff(a, b);
    const change = findFirstChangeByPath(changes, 'enumA');

    expect(changes.length).toEqual(1);
    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.message).toEqual(
      `Description 'Old Description' on type 'enumA' has changed to 'New Description'`,
    );
  });

  test('deprecation reason changed', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A @deprecated(reason: "Old Reason")
        B
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A @deprecated(reason: "New Reason")
        B
      }
    `);

    const changes = await diff(a, b);
    const change = findFirstChangeByPath(changes, 'enumA.A.@deprecated');

    expect(changes.length).toEqual(1);
    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.message).toEqual(
      `Enum value 'enumA.A' deprecation reason changed from 'Old Reason' to 'New Reason'`,
    );
  });

  test('deprecation reason added', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A
        B
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A @deprecated(reason: "New Reason")
        B
      }
    `);

    const changes = await diff(a, b);
    expect(changes).toHaveLength(3);
    const directiveChanges = findChangesByPath(changes, 'enumA.A.@deprecated');
    expect(directiveChanges).toHaveLength(2);

    for (const change of directiveChanges) {
      expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
      if (change.type === ChangeType.EnumValueDeprecationReasonAdded) {
        expect(change.message).toEqual(
          `Enum value 'enumA.A' was deprecated with reason 'New Reason'`,
        );
      } else if (change.type === ChangeType.DirectiveUsageEnumValueAdded) {
        expect(change.message).toEqual(`Directive 'deprecated' was added to enum value 'enumA.A'`);
      }
    }

    {
      const change = findFirstChangeByPath(changes, 'enumA.A.@deprecated.reason');
      expect(change.type).toEqual(ChangeType.DirectiveUsageArgumentAdded);
      expect(change.message).toEqual(`Argument 'reason' was added to '@deprecated'`);
    }
  });

  test('deprecation reason removed', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A @deprecated(reason: "New Reason")
        B
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A
        B
      }
    `);

    const changes = await diff(a, b);
    const change = findFirstChangeByPath(changes, 'enumA.A');

    expect(changes.length).toEqual(2);
    expect(change.criticality.level).toEqual(CriticalityLevel.NonBreaking);
    expect(change.message).toEqual(`Deprecation reason was removed from enum value 'enumA.A'`);
  });

  test('removal of a deprecated field', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A @deprecated(reason: "New Reason")
        B
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        B
      }
    `);

    const changes = await diff(a, b);
    const change = findFirstChangeByPath(changes, 'enumA.A');

    expect(changes.length).toEqual(1);
    expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
    expect(change.message).toEqual(`Enum value 'A' (deprecated) was removed from enum 'enumA'`);

    // suppressRemovalOfDeprecatedField rule should make it only Dangerous

    const changesWithRule = await diff(a, b, [DiffRule.suppressRemovalOfDeprecatedField]);
    const changeWithRule = findFirstChangeByPath(changesWithRule, 'enumA.A');

    expect(changesWithRule.length).toEqual(1);
    expect(changeWithRule.criticality.level).toEqual(CriticalityLevel.Dangerous);
    expect(changeWithRule.message).toEqual(
      "Enum value 'A' (deprecated) was removed from enum 'enumA'",
    );
  });

  test('value added should be Breaking when dangerousBreaking rule is used', async () => {
    const a = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A
        B
      }
    `);

    const b = buildSchema(/* GraphQL */ `
      type Query {
        fieldA: String
      }

      enum enumA {
        A
        B
        C
      }
    `);

    const changes = await diff(a, b, [DiffRule.dangerousBreaking]);
    const change = findFirstChangeByPath(changes, 'enumA.C');

    expect(changes.length).toEqual(1);
    expect(change.criticality.level).toEqual(CriticalityLevel.Breaking);
    expect(change.criticality.reason).toBeDefined();
    expect(change.message).toEqual(`Enum value 'C' was added to enum 'enumA'`);
  });
});
