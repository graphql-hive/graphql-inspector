import { Kind } from 'graphql';
import { CriticalityLevel, type Change, type TypeOfChangeType } from '@graphql-inspector/core';
import { isChangeEqual, requiredMatchMetaMap } from '../src/index';

describe('isChangeEqual', () => {
  describe('Directive Changes', () => {
    test('DIRECTIVE_ADDED', () => {
      const uncheckedMetadata = {
        addedDirectiveDescription: '',
        addedDirectiveLocations: [],
        addedDirectiveRepeatable: false,
      };
      const a: Change<'DIRECTIVE_ADDED'> = {
        type: 'DIRECTIVE_ADDED',
        path: '@auth',
        meta: { addedDirectiveName: 'auth', ...uncheckedMetadata },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      const b: Change<'DIRECTIVE_ADDED'> = {
        type: 'DIRECTIVE_ADDED',
        path: '@auth',
        meta: { addedDirectiveName: 'auth', ...uncheckedMetadata },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      const c: Change<'DIRECTIVE_ADDED'> = {
        type: 'DIRECTIVE_ADDED',
        path: '@auth',
        meta: { addedDirectiveName: 'memo', ...uncheckedMetadata },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, b)).toBe(true);
      expect(isChangeEqual(a, c)).toBe(false);
    });

    test('DIRECTIVE_ARGUMENT_ADDED', () => {
      const meta = {
        addedDirectiveArgumentName: 'role',
        addedDirectiveArgumentType: 'String',
        directiveName: 'auth',
      };
      const uncheckedMetadata = {
        addedToNewDirective: true,
        addedDirectiveArgumentTypeIsNonNull: false,
      };
      const a: Change<'DIRECTIVE_ARGUMENT_ADDED'> = {
        type: 'DIRECTIVE_ARGUMENT_ADDED',
        path: '@auth',
        meta: { ...meta, ...uncheckedMetadata },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      const b: Change<'DIRECTIVE_ARGUMENT_ADDED'> = {
        type: 'DIRECTIVE_ARGUMENT_ADDED',
        path: '@auth',
        meta: { ...meta, ...uncheckedMetadata, addedDirectiveArgumentType: 'Int' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, a)).toBe(true);
      expect(isChangeEqual(a, b)).toBe(false);
    });

    test('DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED', () => {
      const meta = {
        directiveArgumentName: 'id',
        directiveName: 'test',
        newDirectiveArgumentDefaultValue: '1',
      };
      const a: Change<'DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED'> = {
        type: 'DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED',
        path: '@test',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      const b: Change<'DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED'> = {
        type: 'DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED',
        path: '@test',
        meta: { ...meta, newDirectiveArgumentDefaultValue: '2' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, a)).toBe(true);
      expect(isChangeEqual(a, b)).toBe(false);
    });

    test('DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED', () => {
      const meta: Change<'DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED'>['meta'] = {
        directiveArgumentName: 'id',
        directiveName: 'test',
        newDirectiveArgumentDescription: 'desc',
        oldDirectiveArgumentDescription: 'foo',
      };
      const a: Change<'DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED'> = {
        type: 'DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED',
        path: '@test',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      const b: Change<'DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED'> = {
        type: 'DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED',
        path: '@test',
        meta: { ...meta, newDirectiveArgumentDescription: 'new' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, a)).toBe(true);
      expect(isChangeEqual(a, b)).toBe(false);
    });

    test('DIRECTIVE_ARGUMENT_REMOVED', () => {
      const meta: Change<'DIRECTIVE_ARGUMENT_REMOVED'>['meta'] = {
        directiveName: 'auth',
        removedDirectiveArgumentName: 'role',
      };
      const a: Change<'DIRECTIVE_ARGUMENT_REMOVED'> = {
        type: 'DIRECTIVE_ARGUMENT_REMOVED',
        path: '@auth',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(
        isChangeEqual(a, { ...a, meta: { ...meta, removedDirectiveArgumentName: 'id' } }),
      ).toBe(false);
    });

    test('DIRECTIVE_ARGUMENT_TYPE_CHANGED', () => {
      const meta: Change<'DIRECTIVE_ARGUMENT_TYPE_CHANGED'>['meta'] = {
        directiveArgumentName: 'id',
        directiveName: 'test',
        newDirectiveArgumentType: 'String',
        isSafeDirectiveArgumentTypeChange: false,
        oldDirectiveArgumentType: 'ID',
      };
      const a: Change<'DIRECTIVE_ARGUMENT_TYPE_CHANGED'> = {
        type: 'DIRECTIVE_ARGUMENT_TYPE_CHANGED',
        path: '@test',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, newDirectiveArgumentType: 'Int' } })).toBe(
        false,
      );
    });

    test('DIRECTIVE_DESCRIPTION_CHANGED', () => {
      const a: Change<'DIRECTIVE_DESCRIPTION_CHANGED'> = {
        type: 'DIRECTIVE_DESCRIPTION_CHANGED',
        path: '@auth',
        meta: {
          directiveName: 'auth',
          newDirectiveDescription: 'new',
          oldDirectiveDescription: 'foo',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, newDirectiveDescription: 'old' } })).toBe(
        false,
      );
    });

    test('DIRECTIVE_LOCATION_ADDED', () => {
      const a: Change<'DIRECTIVE_LOCATION_ADDED'> = {
        type: 'DIRECTIVE_LOCATION_ADDED',
        path: '@auth',
        meta: { addedDirectiveLocation: 'FIELD', directiveName: 'auth' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedDirectiveLocation: 'QUERY' } })).toBe(
        false,
      );
    });

    test('DIRECTIVE_LOCATION_REMOVED', () => {
      const a: Change<'DIRECTIVE_LOCATION_REMOVED'> = {
        type: 'DIRECTIVE_LOCATION_REMOVED',
        path: '@auth',
        meta: { directiveName: 'auth', removedDirectiveLocation: 'FIELD' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(
        isChangeEqual(a, { ...a, meta: { ...a.meta, removedDirectiveLocation: 'QUERY' } }),
      ).toBe(false);
    });

    test('DIRECTIVE_REMOVED', () => {
      const a: Change<'DIRECTIVE_REMOVED'> = {
        type: 'DIRECTIVE_REMOVED',
        path: '@auth',
        meta: { removedDirectiveName: 'auth' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { removedDirectiveName: 'other' } })).toBe(false);
    });

    test('DIRECTIVE_REPEATABLE_ADDED', () => {
      const a: Change<'DIRECTIVE_REPEATABLE_ADDED'> = {
        type: 'DIRECTIVE_REPEATABLE_ADDED',
        path: '@auth',
        meta: { directiveName: 'auth' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, a)).toBe(true);
    });

    test('DIRECTIVE_REPEATABLE_REMOVED', () => {
      const a: Change<'DIRECTIVE_REPEATABLE_REMOVED'> = {
        type: 'DIRECTIVE_REPEATABLE_REMOVED',
        path: '@auth',
        meta: { directiveName: 'auth' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, a)).toBe(true);
    });
  });

  describe('Directive Usage Changes', () => {
    test('DIRECTIVE_USAGE_ARGUMENT_ADDED', () => {
      const meta: Change<'DIRECTIVE_USAGE_ARGUMENT_ADDED'>['meta'] = {
        addedArgumentName: 'a',
        directiveName: 'd',
        parentArgumentName: 'pa',
        parentEnumValueName: 'pe',
        parentFieldName: 'pf',
        parentTypeName: 'pt',
        addedArgumentValue: 'Foo',
        directiveRepeatedTimes: 1,
        oldArgumentValue: null,
      };
      const a: Change<'DIRECTIVE_USAGE_ARGUMENT_ADDED'> = {
        type: 'DIRECTIVE_USAGE_ARGUMENT_ADDED',
        path: 'path',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, addedArgumentName: 'b' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_ARGUMENT_DEFINITION_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_ARGUMENT_DEFINITION_ADDED'> = {
        type: 'DIRECTIVE_USAGE_ARGUMENT_DEFINITION_ADDED',
        path: 'path',
        meta: {
          addedDirectiveName: 'd',
          argumentName: 'a',
          fieldName: 'f',
          typeName: 't',
          addedToNewType: true,
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, argumentName: 'b' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_ARGUMENT_DEFINITION_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_ARGUMENT_DEFINITION_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_ARGUMENT_DEFINITION_REMOVED',
        path: 'path',
        meta: {
          argumentName: 'a',
          fieldName: 'f',
          removedDirectiveName: 'd',
          typeName: 't',
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, removedDirectiveName: 'x' } })).toBe(
        false,
      );
    });

    test('DIRECTIVE_USAGE_ARGUMENT_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_ARGUMENT_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_ARGUMENT_REMOVED',
        path: 'path',
        meta: {
          directiveName: 'd',
          parentArgumentName: 'pa',
          parentEnumValueName: 'pe',
          parentFieldName: 'pf',
          parentTypeName: 'pt',
          removedArgumentName: 'ra',
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, removedArgumentName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_ENUM_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_ENUM_ADDED'> = {
        type: 'DIRECTIVE_USAGE_ENUM_ADDED',
        path: 'p',
        meta: {
          addedDirectiveName: 'd',
          enumName: 'e',
          addedToNewType: false,
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, enumName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_ENUM_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_ENUM_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_ENUM_REMOVED',
        path: 'p',
        meta: { enumName: 'e', removedDirectiveName: 'd', directiveRepeatedTimes: 1 },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, enumName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_ENUM_VALUE_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_ENUM_VALUE_ADDED'> = {
        type: 'DIRECTIVE_USAGE_ENUM_VALUE_ADDED',
        path: 'p',
        meta: {
          addedDirectiveName: 'd',
          enumName: 'e',
          enumValueName: 'v',
          addedToNewType: true,
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, enumValueName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_ENUM_VALUE_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_ENUM_VALUE_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_ENUM_VALUE_REMOVED',
        path: 'p',
        meta: {
          enumName: 'e',
          enumValueName: 'v',
          removedDirectiveName: 'd',
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, enumValueName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_FIELD_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_FIELD_ADDED'> = {
        type: 'DIRECTIVE_USAGE_FIELD_ADDED',
        path: 'p',
        meta: { addedDirectiveName: 'd', fieldName: 'f', typeName: 't', directiveRepeatedTimes: 1 },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, fieldName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_FIELD_DEFINITION_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_FIELD_DEFINITION_ADDED'> = {
        type: 'DIRECTIVE_USAGE_FIELD_DEFINITION_ADDED',
        path: 'p',
        meta: {
          addedDirectiveName: 'd',
          fieldName: 'f',
          typeName: 't',
          addedToNewType: false,
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, typeName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_FIELD_DEFINITION_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_FIELD_DEFINITION_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_FIELD_DEFINITION_REMOVED',
        path: 'p',
        meta: {
          fieldName: 'f',
          removedDirectiveName: 'd',
          typeName: 't',
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, typeName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_FIELD_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_FIELD_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_FIELD_REMOVED',
        path: 'p',
        meta: {
          fieldName: 'f',
          removedDirectiveName: 'd',
          typeName: 't',
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, fieldName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_ADDED'> = {
        type: 'DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_ADDED',
        path: 'p',
        meta: {
          addedDirectiveName: 'd',
          inputFieldName: 'if',
          inputObjectName: 'io',
          inputFieldType: 'it',
          addedToNewType: true,
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, inputFieldType: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_REMOVED',
        path: 'p',
        meta: {
          inputFieldName: 'if',
          inputObjectName: 'io',
          removedDirectiveName: 'd',
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, inputFieldName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_INPUT_OBJECT_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_INPUT_OBJECT_ADDED'> = {
        type: 'DIRECTIVE_USAGE_INPUT_OBJECT_ADDED',
        path: 'p',
        meta: {
          addedDirectiveName: 'd',
          addedInputFieldName: 'af',
          inputObjectName: 'io',
          addedInputFieldType: 'Foo',
          addedToNewType: true,
          directiveRepeatedTimes: 2,
          isAddedInputFieldTypeNullable: false,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedInputFieldName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_INPUT_OBJECT_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_INPUT_OBJECT_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_INPUT_OBJECT_REMOVED',
        path: 'p',
        meta: {
          inputObjectName: 'io',
          removedDirectiveName: 'd',
          removedInputFieldName: 'rf',
          directiveRepeatedTimes: 3,
          isRemovedInputFieldTypeNullable: true,
          removedInputFieldType: 'Foo',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, removedInputFieldName: 'x' } })).toBe(
        false,
      );
    });

    test('DIRECTIVE_USAGE_INTERFACE_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_INTERFACE_ADDED'> = {
        type: 'DIRECTIVE_USAGE_INTERFACE_ADDED',
        path: 'p',
        meta: {
          addedDirectiveName: 'd',
          interfaceName: 'i',
          addedToNewType: true,
          directiveRepeatedTimes: 3,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, interfaceName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_INTERFACE_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_INTERFACE_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_INTERFACE_REMOVED',
        path: 'p',
        meta: { interfaceName: 'i', removedDirectiveName: 'd', directiveRepeatedTimes: 3 },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, interfaceName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_OBJECT_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_OBJECT_ADDED'> = {
        type: 'DIRECTIVE_USAGE_OBJECT_ADDED',
        path: 'p',
        meta: {
          addedDirectiveName: 'd',
          objectName: 'o',
          addedToNewType: false,
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, objectName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_OBJECT_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_OBJECT_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_OBJECT_REMOVED',
        path: 'p',
        meta: { objectName: 'o', removedDirectiveName: 'd', directiveRepeatedTimes: 2 },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, objectName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_SCALAR_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_SCALAR_ADDED'> = {
        type: 'DIRECTIVE_USAGE_SCALAR_ADDED',
        path: 'p',
        meta: {
          addedDirectiveName: 'd',
          scalarName: 's',
          addedToNewType: false,
          directiveRepeatedTimes: 4,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, scalarName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_SCALAR_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_SCALAR_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_SCALAR_REMOVED',
        path: 'p',
        meta: { removedDirectiveName: 'd', scalarName: 's', directiveRepeatedTimes: 1 },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, scalarName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_SCHEMA_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_SCHEMA_ADDED'> = {
        type: 'DIRECTIVE_USAGE_SCHEMA_ADDED',
        path: 'schema',
        meta: {
          addedDirectiveName: 'd',
          addedToNewType: false,
          directiveRepeatedTimes: 1,
          schemaTypeName: '',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedDirectiveName: 'x' } })).toBe(false);
    });

    test('DIRECTIVE_USAGE_SCHEMA_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_SCHEMA_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_SCHEMA_REMOVED',
        path: 'schema',
        meta: { removedDirectiveName: 'd', directiveRepeatedTimes: 1, schemaTypeName: '' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(
        isChangeEqual(a, {
          ...a,
          meta: { removedDirectiveName: 'x', directiveRepeatedTimes: 2, schemaTypeName: '' },
        }),
      ).toBe(false);
    });

    test('DIRECTIVE_USAGE_UNION_MEMBER_ADDED', () => {
      const a: Change<'DIRECTIVE_USAGE_UNION_MEMBER_ADDED'> = {
        type: 'DIRECTIVE_USAGE_UNION_MEMBER_ADDED',
        path: 'p',
        meta: {
          addedDirectiveName: 'd',
          addedUnionMemberTypeName: 'ut',
          unionName: 'u',
          addedToNewType: false,
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedUnionMemberTypeName: 'x' } })).toBe(
        false,
      );
    });

    test('DIRECTIVE_USAGE_UNION_MEMBER_REMOVED', () => {
      const a: Change<'DIRECTIVE_USAGE_UNION_MEMBER_REMOVED'> = {
        type: 'DIRECTIVE_USAGE_UNION_MEMBER_REMOVED',
        path: 'p',
        meta: {
          removedDirectiveName: 'd',
          removedUnionMemberTypeName: 'ut',
          unionName: 'u',
          directiveRepeatedTimes: 1,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, removedUnionMemberTypeName: 'x' } })).toBe(
        false,
      );
    });
  });

  describe('Enum Value Changes', () => {
    test('ENUM_VALUE_ADDED', () => {
      const a: Change<'ENUM_VALUE_ADDED'> = {
        type: 'ENUM_VALUE_ADDED',
        path: 'R.A',
        meta: {
          addedEnumValueName: 'A',
          enumName: 'R',
          addedDirectiveDescription: '',
          addedToNewType: false,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedEnumValueName: 'B' } })).toBe(false);
    });

    test('ENUM_VALUE_DEPRECATION_REASON_ADDED', () => {
      const meta = { addedValueDeprecationReason: 'r', enumName: 'E', enumValueName: 'V' };
      const a: Change<'ENUM_VALUE_DEPRECATION_REASON_ADDED'> = {
        type: 'ENUM_VALUE_DEPRECATION_REASON_ADDED',
        path: 'p',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, addedValueDeprecationReason: 'x' } })).toBe(
        false,
      );
    });

    test('ENUM_VALUE_DEPRECATION_REASON_CHANGED', () => {
      const a: Change<'ENUM_VALUE_DEPRECATION_REASON_CHANGED'> = {
        type: 'ENUM_VALUE_DEPRECATION_REASON_CHANGED',
        path: 'p',
        meta: {
          enumName: 'E',
          enumValueName: 'V',
          newEnumValueDeprecationReason: 'r',
          oldEnumValueDeprecationReason: '',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(
        isChangeEqual(a, { ...a, meta: { ...a.meta, newEnumValueDeprecationReason: 'x' } }),
      ).toBe(false);
    });

    test('ENUM_VALUE_DEPRECATION_REASON_REMOVED', () => {
      const a: Change<'ENUM_VALUE_DEPRECATION_REASON_REMOVED'> = {
        type: 'ENUM_VALUE_DEPRECATION_REASON_REMOVED',
        path: 'p',
        meta: { enumName: 'E', enumValueName: 'V', removedEnumValueDeprecationReason: ' ' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, a)).toBe(true);
    });

    test('ENUM_VALUE_DESCRIPTION_CHANGED', () => {
      const a: Change<'ENUM_VALUE_DESCRIPTION_CHANGED'> = {
        type: 'ENUM_VALUE_DESCRIPTION_CHANGED',
        path: 'p',
        meta: {
          enumName: 'E',
          enumValueName: 'V',
          newEnumValueDescription: 'd',
          oldEnumValueDescription: 'foo',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, newEnumValueDescription: 'x' } })).toBe(
        false,
      );
    });

    test('ENUM_VALUE_REMOVED', () => {
      const a: Change<'ENUM_VALUE_REMOVED'> = {
        type: 'ENUM_VALUE_REMOVED',
        path: 'p',
        meta: { enumName: 'E', removedEnumValueName: 'V', isEnumValueDeprecated: true },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, removedEnumValueName: 'X' } })).toBe(
        false,
      );
    });
  });

  describe('Field Changes', () => {
    test('FIELD_ADDED', () => {
      const a: Change<'FIELD_ADDED'> = {
        type: 'FIELD_ADDED',
        path: 'U.i',
        meta: { addedFieldName: 'i', typeName: 'U', addedFieldReturnType: 'String', typeType: '' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedFieldName: 'x' } })).toBe(false);
    });

    test('FIELD_ARGUMENT_ADDED', () => {
      const a: Change<'FIELD_ARGUMENT_ADDED'> = {
        type: 'FIELD_ARGUMENT_ADDED',
        path: 'p',
        meta: {
          addedArgumentName: 'a',
          addedArgumentType: 't',
          fieldName: 'f',
          typeName: 'T',
          addedToNewField: false,
          hasDefaultValue: false,
          isAddedFieldArgumentBreaking: false,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedArgumentType: 'x' } })).toBe(false);
    });

    test('FIELD_ARGUMENT_DEFAULT_CHANGED', () => {
      const meta = { argumentName: 'a', fieldName: 'f', newDefaultValue: 'v', typeName: 'T' };
      const a: Change<'FIELD_ARGUMENT_DEFAULT_CHANGED'> = {
        type: 'FIELD_ARGUMENT_DEFAULT_CHANGED',
        path: 'p',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, newDefaultValue: 'x' } })).toBe(false);
    });

    test('FIELD_ARGUMENT_DESCRIPTION_CHANGED', () => {
      const a: Change<'FIELD_ARGUMENT_DESCRIPTION_CHANGED'> = {
        type: 'FIELD_ARGUMENT_DESCRIPTION_CHANGED',
        path: 'p',
        meta: {
          argumentName: 'a',
          fieldName: 'f',
          newDescription: 'd',
          typeName: 'T',
          oldDescription: '',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, newDescription: 'x' } })).toBe(false);
    });

    test('FIELD_ARGUMENT_REMOVED', () => {
      const a: Change<'FIELD_ARGUMENT_REMOVED'> = {
        type: 'FIELD_ARGUMENT_REMOVED',
        path: 'p',
        meta: {
          fieldName: 'f',
          removedFieldArgumentName: 'a',
          typeName: 'T',
          removedFieldType: 'String',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, removedFieldArgumentName: 'x' } })).toBe(
        false,
      );
    });

    test('FIELD_ARGUMENT_TYPE_CHANGED', () => {
      const a: Change<'FIELD_ARGUMENT_TYPE_CHANGED'> = {
        type: 'FIELD_ARGUMENT_TYPE_CHANGED',
        path: 'p',
        meta: {
          argumentName: 'a',
          fieldName: 'f',
          newArgumentType: 't',
          typeName: 'T',
          isSafeArgumentTypeChange: true,
          oldArgumentType: 'String',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, newArgumentType: 'x' } })).toBe(false);
    });

    test('FIELD_DEPRECATION_ADDED', () => {
      const a: Change<'FIELD_DEPRECATION_ADDED'> = {
        type: 'FIELD_DEPRECATION_ADDED',
        path: 'p',
        meta: { fieldName: 'f', typeName: 'T', deprecationReason: '' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta } })).toBe(true);
    });

    test('FIELD_DEPRECATION_REASON_ADDED', () => {
      const meta = { addedDeprecationReason: 'r', fieldName: 'f', typeName: 'T' };
      const a: Change<'FIELD_DEPRECATION_REASON_ADDED'> = {
        type: 'FIELD_DEPRECATION_REASON_ADDED',
        path: 'p',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, addedDeprecationReason: 'x' } })).toBe(
        false,
      );
    });

    test('FIELD_DEPRECATION_REASON_CHANGED', () => {
      const a: Change<'FIELD_DEPRECATION_REASON_CHANGED'> = {
        type: 'FIELD_DEPRECATION_REASON_CHANGED',
        path: 'p',
        meta: {
          fieldName: 'f',
          newDeprecationReason: 'r',
          typeName: 'T',
          oldDeprecationReason: '',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, newDeprecationReason: 'x' } })).toBe(
        false,
      );
    });

    test('FIELD_DEPRECATION_REASON_REMOVED', () => {
      const a: Change<'FIELD_DEPRECATION_REASON_REMOVED'> = {
        type: 'FIELD_DEPRECATION_REASON_REMOVED',
        path: 'p',
        meta: { fieldName: 'f' } as any,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, a)).toBe(true);
    });

    test('FIELD_DEPRECATION_REMOVED', () => {
      const a: Change<'FIELD_DEPRECATION_REMOVED'> = {
        type: 'FIELD_DEPRECATION_REMOVED',
        path: 'p',
        meta: { fieldName: 'f', typeName: 'T' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, a)).toBe(true);
    });

    test('FIELD_DESCRIPTION_ADDED', () => {
      const meta = { addedDescription: 'd', fieldName: 'f', typeName: 'T' };
      const a: Change<'FIELD_DESCRIPTION_ADDED'> = {
        type: 'FIELD_DESCRIPTION_ADDED',
        path: 'p',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, addedDescription: 'x' } })).toBe(false);
    });

    test('FIELD_DESCRIPTION_CHANGED', () => {
      const a: Change<'FIELD_DESCRIPTION_CHANGED'> = {
        type: 'FIELD_DESCRIPTION_CHANGED',
        path: 'p',
        meta: { fieldName: 'f', newDescription: 'd', typeName: 'T', oldDescription: 'asdf' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, newDescription: 'x' } })).toBe(false);
    });

    test('FIELD_DESCRIPTION_REMOVED', () => {
      const a: Change<'FIELD_DESCRIPTION_REMOVED'> = {
        type: 'FIELD_DESCRIPTION_REMOVED',
        path: 'p',
        meta: { fieldName: 'f', typeName: 'T' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, a)).toBe(true);
    });

    test('FIELD_REMOVED', () => {
      const a: Change<'FIELD_REMOVED'> = {
        type: 'FIELD_REMOVED',
        path: 'p',
        meta: {
          removedFieldName: 'f',
          typeName: 'T',
          isRemovedFieldDeprecated: true,
          typeType: '',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, removedFieldName: 'x' } })).toBe(false);
    });

    test('FIELD_TYPE_CHANGED', () => {
      const a: Change<'FIELD_TYPE_CHANGED'> = {
        type: 'FIELD_TYPE_CHANGED',
        path: 'p',
        meta: {
          fieldName: 'f',
          newFieldType: 't',
          typeName: 'T',
          isSafeFieldTypeChange: true,
          oldFieldType: 'X',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, newFieldType: 'x' } })).toBe(false);
    });
  });

  describe('Input Field Changes', () => {
    test('INPUT_FIELD_ADDED', () => {
      const a: Change<'INPUT_FIELD_ADDED'> = {
        type: 'INPUT_FIELD_ADDED',
        path: 'p',
        meta: {
          addedInputFieldName: 'af',
          addedInputFieldType: 'at',
          inputName: 'i',
          addedToNewType: true,
          isAddedInputFieldTypeNullable: false,
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedInputFieldType: 'x' } })).toBe(false);
    });

    test('INPUT_FIELD_DEFAULT_VALUE_CHANGED', () => {
      const meta = { inputFieldName: 'f', inputName: 'i', newDefaultValue: 'v' };
      const a: Change<'INPUT_FIELD_DEFAULT_VALUE_CHANGED'> = {
        type: 'INPUT_FIELD_DEFAULT_VALUE_CHANGED',
        path: 'p',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, newDefaultValue: 'x' } })).toBe(false);
    });

    test('INPUT_FIELD_DESCRIPTION_ADDED', () => {
      const a: Change<'INPUT_FIELD_DESCRIPTION_ADDED'> = {
        type: 'INPUT_FIELD_DESCRIPTION_ADDED',
        path: 'p',
        meta: { addedInputFieldDescription: 'd', inputFieldName: 'f', inputName: 'i' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedInputFieldDescription: 'x' } })).toBe(
        false,
      );
    });

    test('INPUT_FIELD_DESCRIPTION_CHANGED', () => {
      const a: Change<'INPUT_FIELD_DESCRIPTION_CHANGED'> = {
        type: 'INPUT_FIELD_DESCRIPTION_CHANGED',
        path: 'p',
        meta: { inputFieldName: 'f', inputName: 'i', newInputFieldDescription: 'd' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, newInputFieldDescription: 'x' } })).toBe(
        false,
      );
    });

    test('INPUT_FIELD_DESCRIPTION_REMOVED', () => {
      const a: Change<'INPUT_FIELD_DESCRIPTION_REMOVED'> = {
        type: 'INPUT_FIELD_DESCRIPTION_REMOVED',
        path: 'p',
        meta: { inputFieldName: 'f', inputName: 'i', removedDescription: 'Before removed' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, removedDescription: 'Removed' } })).toBe(
        true,
      );
    });

    test('INPUT_FIELD_REMOVED', () => {
      const a: Change<'INPUT_FIELD_REMOVED'> = {
        type: 'INPUT_FIELD_REMOVED',
        path: 'p',
        meta: { inputName: 'i', removedFieldName: 'f', isInputFieldDeprecated: false },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(
        isChangeEqual(a, {
          ...a,
          meta: { ...a.meta, removedFieldName: 'x', isInputFieldDeprecated: true },
        }),
      ).toBe(false);
    });

    test('INPUT_FIELD_TYPE_CHANGED', () => {
      const a: Change<'INPUT_FIELD_TYPE_CHANGED'> = {
        type: 'INPUT_FIELD_TYPE_CHANGED',
        path: 'p',
        meta: {
          inputFieldName: 'f',
          inputName: 'i',
          newInputFieldType: 't',
          isInputFieldTypeChangeSafe: true,
          oldInputFieldType: 'Foo',
        },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, newInputFieldType: 'x' } })).toBe(false);
    });
  });

  describe('Type & Interface Changes', () => {
    test('OBJECT_TYPE_INTERFACE_ADDED', () => {
      const a: Change<'OBJECT_TYPE_INTERFACE_ADDED'> = {
        type: 'OBJECT_TYPE_INTERFACE_ADDED',
        path: 'p',
        meta: { addedInterfaceName: 'i', objectTypeName: 'o', addedToNewType: true },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedInterfaceName: 'x' } })).toBe(false);
    });

    test('OBJECT_TYPE_INTERFACE_REMOVED', () => {
      const a: Change<'OBJECT_TYPE_INTERFACE_REMOVED'> = {
        type: 'OBJECT_TYPE_INTERFACE_REMOVED',
        path: 'p',
        meta: { objectTypeName: 'o', removedInterfaceName: 'i' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, removedInterfaceName: 'x' } })).toBe(
        false,
      );
    });

    test('TYPE_ADDED', () => {
      const a: Change<'TYPE_ADDED'> = {
        type: 'TYPE_ADDED',
        path: 'p',
        meta: { addedTypeKind: Kind.OBJECT_TYPE_DEFINITION, addedTypeName: 'T' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, addedTypeName: 'X' } })).toBe(false);
    });

    test('TYPE_DESCRIPTION_ADDED', () => {
      const meta = { addedTypeDescription: 'd', typeName: 'T' };
      const a: Change<'TYPE_DESCRIPTION_ADDED'> = {
        type: 'TYPE_DESCRIPTION_ADDED',
        path: 'p',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, addedTypeDescription: 'x' } })).toBe(false);
    });

    test('TYPE_DESCRIPTION_CHANGED', () => {
      const a: Change<'TYPE_DESCRIPTION_CHANGED'> = {
        type: 'TYPE_DESCRIPTION_CHANGED',
        path: 'p',
        meta: { newTypeDescription: 'd', typeName: 'T', oldTypeDescription: 'foo' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...a.meta, newTypeDescription: 'x' } })).toBe(false);
    });

    test('TYPE_DESCRIPTION_REMOVED', () => {
      const a: Change<'TYPE_DESCRIPTION_REMOVED'> = {
        type: 'TYPE_DESCRIPTION_REMOVED',
        path: 'p',
        meta: { typeName: 'T', removedTypeDescription: 'Foo' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, a)).toBe(true);
    });

    test('TYPE_KIND_CHANGED', () => {
      const meta = { newTypeKind: 'ENUM', typeName: 'T', oldTypeKind: 'SCALAR' };
      const a: Change<'TYPE_KIND_CHANGED'> = {
        type: 'TYPE_KIND_CHANGED',
        path: 'p',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, newTypeKind: 'SCALAR' } })).toBe(false);
    });

    test('TYPE_REMOVED', () => {
      const a: Change<'TYPE_REMOVED'> = {
        type: 'TYPE_REMOVED',
        path: 'p',
        meta: { removedTypeName: 'T' },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { removedTypeName: 'X' } })).toBe(false);
    });
  });

  describe('Union & Schema Changes', () => {
    test('UNION_MEMBER_ADDED', () => {
      const meta = { addedUnionMemberTypeName: 'ut', unionName: 'u', addedToNewType: false };
      const a: Change<'UNION_MEMBER_ADDED'> = {
        type: 'UNION_MEMBER_ADDED',
        path: 'p',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, addedUnionMemberTypeName: 'x' } })).toBe(
        false,
      );
    });

    test('UNION_MEMBER_REMOVED', () => {
      const meta = { removedUnionMemberTypeName: 'ut', unionName: 'u' };
      const a: Change<'UNION_MEMBER_REMOVED'> = {
        type: 'UNION_MEMBER_REMOVED',
        path: 'p',
        meta,
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(isChangeEqual(a, { ...a, meta: { ...meta, removedUnionMemberTypeName: 'x' } })).toBe(
        false,
      );
    });

    test('SCHEMA_MUTATION_TYPE_CHANGED', () => {
      const a: Change<'SCHEMA_MUTATION_TYPE_CHANGED'> = {
        type: 'SCHEMA_MUTATION_TYPE_CHANGED',
        path: 'schema',
        meta: { newMutationTypeName: 'M', oldMutationTypeName: null },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(
        isChangeEqual(a, { ...a, meta: { newMutationTypeName: 'X', oldMutationTypeName: null } }),
      ).toBe(false);
    });

    test('SCHEMA_QUERY_TYPE_CHANGED', () => {
      const a: Change<'SCHEMA_QUERY_TYPE_CHANGED'> = {
        type: 'SCHEMA_QUERY_TYPE_CHANGED',
        path: 'schema',
        meta: { newQueryTypeName: 'Q', oldQueryTypeName: null },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(
        isChangeEqual(a, { ...a, meta: { newQueryTypeName: 'X', oldQueryTypeName: null } }),
      ).toBe(false);
    });

    test('SCHEMA_SUBSCRIPTION_TYPE_CHANGED', () => {
      const a: Change<'SCHEMA_SUBSCRIPTION_TYPE_CHANGED'> = {
        type: 'SCHEMA_SUBSCRIPTION_TYPE_CHANGED',
        path: 'schema',
        meta: { newSubscriptionTypeName: 'S', oldSubscriptionTypeName: null },
        message: 'Example',
        criticality: { level: CriticalityLevel.NonBreaking },
      };
      expect(
        isChangeEqual(a, {
          ...a,
          meta: { newSubscriptionTypeName: 'X', oldSubscriptionTypeName: null },
        }),
      ).toBe(false);
    });
  });

  describe('Non metadata comparisons', () => {
    const allChangeTypes = Object.keys(requiredMatchMetaMap) as TypeOfChangeType[];

    describe.each(allChangeTypes)('Type: %s', (changeType: TypeOfChangeType) => {
      const requiredKeys = requiredMatchMetaMap[changeType];

      // Helper to create a valid meta object based on required keys
      const createMeta = (value: string) => {
        return requiredKeys.reduce((acc, key) => {
          acc[key] = value;
          return acc;
        }, {} as any);
      };

      it('should return false when the path differs', () => {
        const meta = createMeta('match-value');
        const a: Change<typeof changeType> = {
          type: changeType,
          path: 'path.a',
          meta,
          message: 'Example',
          criticality: { level: CriticalityLevel.NonBreaking },
        };
        const b: Change<typeof changeType> = {
          type: changeType,
          path: 'path.b',
          meta,
          message: 'Example',
          criticality: { level: CriticalityLevel.NonBreaking },
        };

        expect(isChangeEqual(a, b)).toBe(false);
      });

      it('should return false when compared against a different change type', () => {
        const otherType = allChangeTypes.find(t => t !== changeType) || 'TYPE_ADDED';
        const a: Change<typeof changeType> = {
          type: changeType,
          path: 'root',
          meta: createMeta('val'),
          message: 'Example',
          criticality: { level: CriticalityLevel.NonBreaking },
        };
        const b: Change<typeof changeType> = {
          type: otherType as any,
          path: 'root',
          meta: {} as any,
          message: 'Example',
          criticality: { level: CriticalityLevel.NonBreaking },
        };

        expect(isChangeEqual(a, b)).toBe(false);
      });
    });

    describe('Edge Cases & Error Handling', () => {
      it('should throw an error if a change type is missing from the match map', () => {
        const invalidChange = {
          type: 'NON_EXISTENT_TYPE',
          path: 'root',
          meta: {},
        };

        // We cast to any to bypass TS and test the runtime error guard
        expect(() => isChangeEqual(invalidChange as any, invalidChange as any)).toThrow(
          'Unhandled change type found',
        );
      });
    });
  });
});
