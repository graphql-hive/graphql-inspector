import type { Change, TypeOfChangeType } from '@graphql-inspector/core';

/**
 * One case that stands out is if the change is to add a repeatable directive, but the
 * comparison first adds a directive, and then adds repeatable.
 *
 * To solve this, eat distinct change to a schema must be tracked separately. This is already
 * happening, but DIRECTIVE_ADDED does include metadata for repeatability... This should
 * likely be deprecated from that change type to keep these changes discrete. Same goes for
 * directive locations.
 */
const requiredMatchMetaMap: {
  [changeType in TypeOfChangeType]: Array<keyof Change<changeType>['meta']>;
} = {
  DIRECTIVE_ADDED: ['addedDirectiveName'],
  DIRECTIVE_ARGUMENT_ADDED: [
    'addedDirectiveArgumentName',
    'addedDirectiveArgumentType',
    'directiveName',
  ],
  DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED: [
    'directiveArgumentName',
    'directiveName',
    'newDirectiveArgumentDefaultValue',
  ],
  DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED: [
    'directiveArgumentName',
    'directiveName',
    'newDirectiveArgumentDescription',
  ],
  DIRECTIVE_ARGUMENT_REMOVED: ['directiveName', 'removedDirectiveArgumentName'],
  DIRECTIVE_ARGUMENT_TYPE_CHANGED: [
    'directiveArgumentName',
    'directiveName',
    'newDirectiveArgumentType',
  ],
  DIRECTIVE_DESCRIPTION_CHANGED: ['directiveName', 'newDirectiveDescription'],
  DIRECTIVE_LOCATION_ADDED: ['addedDirectiveLocation', 'directiveName'],
  DIRECTIVE_LOCATION_REMOVED: ['directiveName', 'removedDirectiveLocation'],
  DIRECTIVE_REMOVED: ['removedDirectiveName'],
  DIRECTIVE_REPEATABLE_ADDED: ['directiveName'],
  DIRECTIVE_REPEATABLE_REMOVED: ['directiveName'],
  DIRECTIVE_USAGE_ARGUMENT_ADDED: [
    'addedArgumentName',
    'directiveName',
    'parentArgumentName',
    'parentEnumValueName',
    'parentFieldName',
    'parentTypeName',
  ],
  DIRECTIVE_USAGE_ARGUMENT_DEFINITION_ADDED: [
    'addedDirectiveName',
    'argumentName',
    'fieldName',
    'typeName',
  ],
  DIRECTIVE_USAGE_ARGUMENT_DEFINITION_REMOVED: [
    'argumentName',
    'fieldName',
    'removedDirectiveName',
    'typeName',
  ],
  DIRECTIVE_USAGE_ARGUMENT_REMOVED: [
    'directiveName',
    'parentArgumentName',
    'parentEnumValueName',
    'parentFieldName',
    'parentTypeName',
    'removedArgumentName',
  ],
  DIRECTIVE_USAGE_ENUM_ADDED: ['addedDirectiveName', 'enumName'], // Should this also match on repeat times also...?
  DIRECTIVE_USAGE_ENUM_REMOVED: ['enumName', 'removedDirectiveName'],
  DIRECTIVE_USAGE_ENUM_VALUE_ADDED: ['addedDirectiveName', 'enumName', 'enumValueName'],
  DIRECTIVE_USAGE_ENUM_VALUE_REMOVED: ['enumName', 'enumValueName', 'removedDirectiveName'],
  DIRECTIVE_USAGE_FIELD_ADDED: ['addedDirectiveName', 'fieldName', 'typeName'],
  DIRECTIVE_USAGE_FIELD_DEFINITION_ADDED: ['addedDirectiveName', 'fieldName', 'typeName'],
  DIRECTIVE_USAGE_FIELD_DEFINITION_REMOVED: ['fieldName', 'removedDirectiveName', 'typeName'],
  DIRECTIVE_USAGE_FIELD_REMOVED: ['fieldName', 'removedDirectiveName', 'typeName'],
  DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_ADDED: [
    'addedDirectiveName',
    'inputFieldName',
    'inputObjectName',
    'inputFieldType',
  ],
  DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_REMOVED: [
    'inputFieldName',
    'inputObjectName',
    'removedDirectiveName',
  ],
  DIRECTIVE_USAGE_INPUT_OBJECT_ADDED: [
    'addedDirectiveName',
    'addedInputFieldName',
    'inputObjectName',
  ],
  DIRECTIVE_USAGE_INPUT_OBJECT_REMOVED: [
    'inputObjectName',
    'removedDirectiveName',
    'removedInputFieldName',
  ],
  DIRECTIVE_USAGE_INTERFACE_ADDED: ['addedDirectiveName', 'interfaceName'],
  DIRECTIVE_USAGE_INTERFACE_REMOVED: ['interfaceName', 'removedDirectiveName'],
  DIRECTIVE_USAGE_OBJECT_ADDED: ['addedDirectiveName', 'objectName'],
  DIRECTIVE_USAGE_OBJECT_REMOVED: ['objectName', 'removedDirectiveName'],
  DIRECTIVE_USAGE_SCALAR_ADDED: ['addedDirectiveName', 'scalarName'],
  DIRECTIVE_USAGE_SCALAR_REMOVED: ['removedDirectiveName', 'scalarName'],
  DIRECTIVE_USAGE_SCHEMA_ADDED: ['addedDirectiveName'],
  DIRECTIVE_USAGE_SCHEMA_REMOVED: ['removedDirectiveName'],
  DIRECTIVE_USAGE_UNION_MEMBER_ADDED: [
    'addedDirectiveName',
    'addedUnionMemberTypeName',
    'unionName',
  ],
  DIRECTIVE_USAGE_UNION_MEMBER_REMOVED: [
    'removedDirectiveName',
    'removedUnionMemberTypeName',
    'unionName',
  ],
  ENUM_VALUE_ADDED: ['addedEnumValueName', 'enumName'],
  ENUM_VALUE_DEPRECATION_REASON_ADDED: ['addedValueDeprecationReason', 'enumName', 'enumValueName'],
  ENUM_VALUE_DEPRECATION_REASON_CHANGED: [
    'enumName',
    'enumValueName',
    'newEnumValueDeprecationReason',
  ],
  ENUM_VALUE_DEPRECATION_REASON_REMOVED: ['enumName', 'enumValueName'],
  ENUM_VALUE_DESCRIPTION_CHANGED: ['enumName', 'enumValueName', 'newEnumValueDescription'],
  ENUM_VALUE_REMOVED: ['enumName', 'removedEnumValueName'],
  FIELD_ADDED: ['addedFieldName', 'typeName'],
  FIELD_ARGUMENT_ADDED: ['addedArgumentName', 'addedArgumentType', 'fieldName', 'typeName'],
  FIELD_ARGUMENT_DEFAULT_CHANGED: ['argumentName', 'fieldName', 'newDefaultValue', 'typeName'],
  FIELD_ARGUMENT_DESCRIPTION_CHANGED: ['argumentName', 'fieldName', 'newDescription', 'typeName'],
  FIELD_ARGUMENT_REMOVED: ['fieldName', 'removedFieldArgumentName', 'typeName'],
  FIELD_ARGUMENT_TYPE_CHANGED: ['argumentName', 'fieldName', 'newArgumentType', 'typeName'],
  FIELD_DEPRECATION_ADDED: ['fieldName', 'typeName'],
  FIELD_DEPRECATION_REASON_ADDED: ['addedDeprecationReason', 'fieldName', 'typeName'],
  FIELD_DEPRECATION_REASON_CHANGED: ['fieldName', 'newDeprecationReason', 'typeName'],
  FIELD_DEPRECATION_REASON_REMOVED: ['fieldName', 'fieldName'],
  FIELD_DEPRECATION_REMOVED: ['fieldName', 'typeName'],
  FIELD_DESCRIPTION_ADDED: ['addedDescription', 'fieldName', 'typeName'],
  FIELD_DESCRIPTION_CHANGED: ['fieldName', 'newDescription', 'typeName'],
  FIELD_DESCRIPTION_REMOVED: ['fieldName', 'typeName'],
  FIELD_REMOVED: ['removedFieldName', 'typeName'],
  FIELD_TYPE_CHANGED: ['fieldName', 'newFieldType', 'typeName'],
  INPUT_FIELD_ADDED: ['addedInputFieldName', 'addedInputFieldType', 'inputName'],
  INPUT_FIELD_DEFAULT_VALUE_CHANGED: ['inputFieldName', 'inputName', 'newDefaultValue'],
  INPUT_FIELD_DESCRIPTION_ADDED: ['addedInputFieldDescription', 'inputFieldName', 'inputName'],
  INPUT_FIELD_DESCRIPTION_CHANGED: ['inputFieldName', 'inputName', 'newInputFieldDescription'],
  INPUT_FIELD_DESCRIPTION_REMOVED: ['inputFieldName', 'inputName'],
  INPUT_FIELD_REMOVED: ['inputName', 'removedFieldName'],
  INPUT_FIELD_TYPE_CHANGED: ['inputFieldName', 'inputName', 'newInputFieldType'],
  OBJECT_TYPE_INTERFACE_ADDED: ['addedInterfaceName', 'objectTypeName'],
  OBJECT_TYPE_INTERFACE_REMOVED: ['objectTypeName', 'removedInterfaceName'],
  SCHEMA_MUTATION_TYPE_CHANGED: ['newMutationTypeName'],
  SCHEMA_QUERY_TYPE_CHANGED: ['newQueryTypeName'],
  SCHEMA_SUBSCRIPTION_TYPE_CHANGED: ['newSubscriptionTypeName'],
  TYPE_ADDED: ['addedTypeKind', 'addedTypeName'],
  TYPE_DESCRIPTION_ADDED: ['addedTypeDescription', 'typeName'],
  TYPE_DESCRIPTION_CHANGED: ['newTypeDescription', 'typeName'],
  TYPE_DESCRIPTION_REMOVED: ['typeName'],
  TYPE_KIND_CHANGED: ['newTypeKind', 'typeName'],
  TYPE_REMOVED: ['removedTypeName'],
  UNION_MEMBER_ADDED: ['addedUnionMemberTypeName', 'unionName'],
  UNION_MEMBER_REMOVED: ['removedUnionMemberTypeName', 'unionName'],
};

/**
 * @throws {Error} if there is no matching change type.
 */
export function isChangeEqual<T extends TypeOfChangeType, Y extends TypeOfChangeType>(
  a: Change<T>,
  b: Change<Y>,
): boolean {
  if ((a.type as TypeOfChangeType) !== b.type || a.path !== b.path) {
    return false;
  }

  const required = requiredMatchMetaMap[b.type];
  if (!required) {
    // this should not occur
    throw new Error('Unhandled change type found');
  }
  return required.every(key => a.meta[key] === b.meta[key]);
}
