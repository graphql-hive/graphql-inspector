import { Kind } from 'graphql';

export enum CriticalityLevel {
  Breaking = 'BREAKING',
  NonBreaking = 'NON_BREAKING',
  Dangerous = 'DANGEROUS',
}

export interface Criticality {
  level: CriticalityLevel;
  reason?: string;
  /** Is `true` if the criticality is safe, because of the usage determined via the `checkUsage` config option. */
  isSafeBasedOnUsage?: boolean;
}

export interface Change<TChange extends keyof Changes = any> {
  message: string;
  path?: string;
  type: TChange;
  meta: Changes[TChange]['meta'];
  criticality: Criticality;
}

export const ChangeType = {
  // Argument
  FieldArgumentDescriptionChanged: 'FIELD_ARGUMENT_DESCRIPTION_CHANGED',
  FieldArgumentDefaultChanged: 'FIELD_ARGUMENT_DEFAULT_CHANGED',
  FieldArgumentTypeChanged: 'FIELD_ARGUMENT_TYPE_CHANGED',
  // Directive
  DirectiveRemoved: 'DIRECTIVE_REMOVED',
  DirectiveAdded: 'DIRECTIVE_ADDED',
  DirectiveDescriptionChanged: 'DIRECTIVE_DESCRIPTION_CHANGED',
  DirectiveLocationAdded: 'DIRECTIVE_LOCATION_ADDED',
  DirectiveLocationRemoved: 'DIRECTIVE_LOCATION_REMOVED',
  DirectiveArgumentAdded: 'DIRECTIVE_ARGUMENT_ADDED',
  DirectiveArgumentRemoved: 'DIRECTIVE_ARGUMENT_REMOVED',
  DirectiveArgumentDescriptionChanged: 'DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED',
  DirectiveArgumentDefaultValueChanged: 'DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED',
  DirectiveArgumentTypeChanged: 'DIRECTIVE_ARGUMENT_TYPE_CHANGED',
  // Enum
  EnumValueRemoved: 'ENUM_VALUE_REMOVED',
  EnumValueAdded: 'ENUM_VALUE_ADDED',
  EnumValueDescriptionChanged: 'ENUM_VALUE_DESCRIPTION_CHANGED',
  EnumValueDeprecationReasonChanged: 'ENUM_VALUE_DEPRECATION_REASON_CHANGED',
  EnumValueDeprecationReasonAdded: 'ENUM_VALUE_DEPRECATION_REASON_ADDED',
  EnumValueDeprecationReasonRemoved: 'ENUM_VALUE_DEPRECATION_REASON_REMOVED',
  // Field
  FieldRemoved: 'FIELD_REMOVED',
  FieldAdded: 'FIELD_ADDED',
  FieldDescriptionChanged: 'FIELD_DESCRIPTION_CHANGED',
  FieldDescriptionAdded: 'FIELD_DESCRIPTION_ADDED',
  FieldDescriptionRemoved: 'FIELD_DESCRIPTION_REMOVED',
  FieldDeprecationAdded: 'FIELD_DEPRECATION_ADDED',
  FieldDeprecationRemoved: 'FIELD_DEPRECATION_REMOVED',
  FieldDeprecationReasonChanged: 'FIELD_DEPRECATION_REASON_CHANGED',
  FieldDeprecationReasonAdded: 'FIELD_DEPRECATION_REASON_ADDED',
  FieldDeprecationReasonRemoved: 'FIELD_DEPRECATION_REASON_REMOVED',
  FieldTypeChanged: 'FIELD_TYPE_CHANGED',
  FieldArgumentAdded: 'FIELD_ARGUMENT_ADDED',
  FieldArgumentRemoved: 'FIELD_ARGUMENT_REMOVED',
  // Input
  InputFieldRemoved: 'INPUT_FIELD_REMOVED',
  InputFieldAdded: 'INPUT_FIELD_ADDED',
  InputFieldDescriptionAdded: 'INPUT_FIELD_DESCRIPTION_ADDED',
  InputFieldDescriptionRemoved: 'INPUT_FIELD_DESCRIPTION_REMOVED',
  InputFieldDescriptionChanged: 'INPUT_FIELD_DESCRIPTION_CHANGED',
  InputFieldDefaultValueChanged: 'INPUT_FIELD_DEFAULT_VALUE_CHANGED',
  InputFieldTypeChanged: 'INPUT_FIELD_TYPE_CHANGED',
  // Type
  ObjectTypeInterfaceAdded: 'OBJECT_TYPE_INTERFACE_ADDED',
  ObjectTypeInterfaceRemoved: 'OBJECT_TYPE_INTERFACE_REMOVED',
  // Schema
  SchemaQueryTypeChanged: 'SCHEMA_QUERY_TYPE_CHANGED',
  SchemaMutationTypeChanged: 'SCHEMA_MUTATION_TYPE_CHANGED',
  SchemaSubscriptionTypeChanged: 'SCHEMA_SUBSCRIPTION_TYPE_CHANGED',
  // Type
  TypeRemoved: 'TYPE_REMOVED',
  TypeAdded: 'TYPE_ADDED',
  TypeKindChanged: 'TYPE_KIND_CHANGED',
  TypeDescriptionChanged: 'TYPE_DESCRIPTION_CHANGED',
  // TODO
  TypeDescriptionRemoved: 'TYPE_DESCRIPTION_REMOVED',
  // TODO
  TypeDescriptionAdded: 'TYPE_DESCRIPTION_ADDED',
  // Union
  UnionMemberRemoved: 'UNION_MEMBER_REMOVED',
  UnionMemberAdded: 'UNION_MEMBER_ADDED',
  // Directive Usage
  DirectiveUsageUnionMemberAdded: 'DIRECTIVE_USAGE_UNION_MEMBER_ADDED',
  DirectiveUsageUnionMemberRemoved: 'DIRECTIVE_USAGE_UNION_MEMBER_REMOVED',
  DirectiveUsageEnumAdded: 'DIRECTIVE_USAGE_ENUM_ADDED',
  DirectiveUsageEnumRemoved: 'DIRECTIVE_USAGE_ENUM_REMOVED',
  DirectiveUsageEnumValueAdded: 'DIRECTIVE_USAGE_ENUM_VALUE_ADDED',
  DirectiveUsageEnumValueRemoved: 'DIRECTIVE_USAGE_ENUM_VALUE_REMOVED',
  DirectiveUsageInputObjectAdded: 'DIRECTIVE_USAGE_INPUT_OBJECT_ADDED',
  DirectiveUsageInputObjectRemoved: 'DIRECTIVE_USAGE_INPUT_OBJECT_REMOVED',
  DirectiveUsageFieldAdded: 'DIRECTIVE_USAGE_FIELD_ADDED',
  DirectiveUsageFieldRemoved: 'DIRECTIVE_USAGE_FIELD_REMOVED',
  DirectiveUsageScalarAdded: 'DIRECTIVE_USAGE_SCALAR_ADDED',
  DirectiveUsageScalarRemoved: 'DIRECTIVE_USAGE_SCALAR_REMOVED',
  DirectiveUsageObjectAdded: 'DIRECTIVE_USAGE_OBJECT_ADDED',
  DirectiveUsageObjectRemoved: 'DIRECTIVE_USAGE_OBJECT_REMOVED',
  DirectiveUsageInterfaceAdded: 'DIRECTIVE_USAGE_INTERFACE_ADDED',
  DirectiveUsageInterfaceRemoved: 'DIRECTIVE_USAGE_INTERFACE_REMOVED',
  DirectiveUsageArgumentDefinitionAdded: 'DIRECTIVE_USAGE_ARGUMENT_DEFINITION_ADDED',
  DirectiveUsageArgumentDefinitionRemoved: 'DIRECTIVE_USAGE_ARGUMENT_DEFINITION_REMOVED',
  DirectiveUsageSchemaAdded: 'DIRECTIVE_USAGE_SCHEMA_ADDED',
  DirectiveUsageSchemaRemoved: 'DIRECTIVE_USAGE_SCHEMA_REMOVED',
  DirectiveUsageFieldDefinitionAdded: 'DIRECTIVE_USAGE_FIELD_DEFINITION_ADDED',
  DirectiveUsageFieldDefinitionRemoved: 'DIRECTIVE_USAGE_FIELD_DEFINITION_REMOVED',
  DirectiveUsageInputFieldDefinitionAdded: 'DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_ADDED',
  DirectiveUsageInputFieldDefinitionRemoved: 'DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_REMOVED',
} as const;

export type TypeOfChangeType = (typeof ChangeType)[keyof typeof ChangeType];

// Directive

export type FieldArgumentDescriptionChangedChange = {
  type: typeof ChangeType.FieldArgumentDescriptionChanged;
  meta: {
    typeName: string;
    fieldName: string;
    argumentName: string;
    oldDescription: string | null;
    newDescription: string | null;
  };
};

export type FieldArgumentDefaultChangedChange = {
  type: typeof ChangeType.FieldArgumentDefaultChanged;
  meta: {
    typeName: string;
    fieldName: string;
    argumentName: string;
    oldDefaultValue?: string;
    newDefaultValue?: string;
  };
};

export type FieldArgumentTypeChangedChange = {
  type: typeof ChangeType.FieldArgumentTypeChanged;
  meta: {
    typeName: string;
    fieldName: string;
    argumentName: string;
    oldArgumentType: string;
    newArgumentType: string;
    isSafeArgumentTypeChange: boolean;
  };
};

export type DirectiveRemovedChange = {
  type: typeof ChangeType.DirectiveRemoved;
  meta: {
    removedDirectiveName: string;
  };
};

export type DirectiveAddedChange = {
  type: typeof ChangeType.DirectiveAdded;
  meta: {
    addedDirectiveName: string;
    addedDirectiveRepeatable: boolean;
    addedDirectiveLocations: string[];
    addedDirectiveDescription: string | null;
  };
};

export type DirectiveDescriptionChangedChange = {
  type: typeof ChangeType.DirectiveDescriptionChanged;
  meta: {
    directiveName: string;
    oldDirectiveDescription: string | null;
    newDirectiveDescription: string | null;
  };
};

export type DirectiveLocationAddedChange = {
  type: typeof ChangeType.DirectiveLocationAdded;
  meta: {
    directiveName: string;
    addedDirectiveLocation: string;
  };
};

export type DirectiveLocationRemovedChange = {
  type: typeof ChangeType.DirectiveLocationRemoved;
  meta: {
    directiveName: string;
    removedDirectiveLocation: string;
  };
};

export type DirectiveArgumentAddedChange = {
  type: typeof ChangeType.DirectiveArgumentAdded;
  meta: {
    directiveName: string;
    addedDirectiveArgumentName: string;
    addedDirectiveArgumentTypeIsNonNull: boolean;
    addedToNewDirective: boolean;
    addedDirectiveArgumentDescription: string | null;
    addedDirectiveArgumentType: string;
    addedDirectiveDefaultValue?: string /* | null */;
  };
};

export type DirectiveArgumentRemovedChange = {
  type: typeof ChangeType.DirectiveArgumentRemoved;
  meta: {
    directiveName: string;
    removedDirectiveArgumentName: string;
  };
};

export type DirectiveArgumentDescriptionChangedChange = {
  type: typeof ChangeType.DirectiveArgumentDescriptionChanged;
  meta: {
    directiveName: string;
    directiveArgumentName: string;
    oldDirectiveArgumentDescription: string | null;
    newDirectiveArgumentDescription: string | null;
  };
};

export type DirectiveArgumentDefaultValueChangedChange = {
  type: typeof ChangeType.DirectiveArgumentDefaultValueChanged;
  meta: {
    directiveName: string;
    directiveArgumentName: string;
    oldDirectiveArgumentDefaultValue?: string /* | null */;
    newDirectiveArgumentDefaultValue?: string /* | null */;
  };
};

export type DirectiveArgumentTypeChangedChange = {
  type: typeof ChangeType.DirectiveArgumentTypeChanged;
  meta: {
    directiveName: string;
    directiveArgumentName: string;
    oldDirectiveArgumentType: string;
    newDirectiveArgumentType: string;
    /** Note: this could also be computed from oldDirectiveArgumentType and newDirectiveArgumentType */
    isSafeDirectiveArgumentTypeChange: boolean;
  };
};

// Enum

export type EnumValueRemovedChange = {
  type: typeof ChangeType.EnumValueRemoved;
  meta: {
    enumName: string;
    removedEnumValueName: string;
    isEnumValueDeprecated: boolean;
  };
};

export type EnumValueAddedChange = {
  type: typeof ChangeType.EnumValueAdded;
  meta: {
    enumName: string;
    addedEnumValueName: string;
    addedToNewType: boolean;
    addedDirectiveDescription: string | null;
  };
};

export type EnumValueDescriptionChangedChange = {
  type: typeof ChangeType.EnumValueDescriptionChanged;
  meta: {
    enumName: string;
    enumValueName: string;
    oldEnumValueDescription: string | null;
    newEnumValueDescription: string | null;
  };
};

export type EnumValueDeprecationReasonChangedChange = {
  type: typeof ChangeType.EnumValueDeprecationReasonChanged;
  meta: {
    enumName: string;
    enumValueName: string;
    oldEnumValueDeprecationReason: string;
    newEnumValueDeprecationReason: string;
  };
};

export type EnumValueDeprecationReasonAddedChange = {
  type: typeof ChangeType.EnumValueDeprecationReasonAdded;
  meta: {
    enumName: string;
    enumValueName: string;
    addedValueDeprecationReason: string;
  };
};

export type EnumValueDeprecationReasonRemovedChange = {
  type: typeof ChangeType.EnumValueDeprecationReasonRemoved;
  meta: {
    enumName: string;
    enumValueName: string;
    removedEnumValueDeprecationReason: string;
  };
};

// Field

export type FieldRemovedChange = {
  type: typeof ChangeType.FieldRemoved;
  meta: {
    typeName: string;
    removedFieldName: string;
    isRemovedFieldDeprecated: boolean;
    typeType: string;
  };
};

export type FieldAddedChange = {
  type: typeof ChangeType.FieldAdded;
  meta: {
    typeName: string;
    addedFieldName: string;
    typeType: string;
    addedFieldReturnType: string;
  };
};

export type FieldDescriptionChangedChange = {
  type: typeof ChangeType.FieldDescriptionChanged;
  meta: {
    typeName: string;
    fieldName: string;
    oldDescription: string;
    newDescription: string;
  };
};

export type FieldDescriptionAddedChange = {
  type: typeof ChangeType.FieldDescriptionAdded;
  meta: {
    typeName: string;
    fieldName: string;
    addedDescription: string;
  };
};

export type FieldDescriptionRemovedChange = {
  type: typeof ChangeType.FieldDescriptionRemoved;
  meta: {
    typeName: string;
    fieldName: string;
  };
};

export type FieldDeprecationAddedChange = {
  type: typeof ChangeType.FieldDeprecationAdded;
  meta: {
    typeName: string;
    fieldName: string;
    deprecationReason: string;
  };
};

export type FieldDeprecationRemovedChange = {
  type: typeof ChangeType.FieldDeprecationRemoved;
  meta: {
    typeName: string;
    fieldName: string;
  };
};

export type FieldDeprecationReasonChangedChange = {
  type: typeof ChangeType.FieldDeprecationReasonChanged;
  meta: {
    typeName: string;
    fieldName: string;
    oldDeprecationReason: string;
    newDeprecationReason: string;
  };
};

export type FieldDeprecationReasonAddedChange = {
  type: typeof ChangeType.FieldDeprecationReasonAdded;
  meta: {
    typeName: string;
    fieldName: string;
    addedDeprecationReason: string;
  };
};

export type FieldDeprecationReasonRemovedChange = {
  type: typeof ChangeType.FieldDeprecationReasonRemoved;
  meta: {
    typeName: string;
    fieldName: string;
  };
};

export type FieldTypeChangedChange = {
  type: typeof ChangeType.FieldTypeChanged;
  meta: {
    typeName: string;
    fieldName: string;
    oldFieldType: string;
    newFieldType: string;
    isSafeFieldTypeChange: boolean;
  };
};

export type DirectiveUsageUnionMemberAddedChange = {
  type: typeof ChangeType.DirectiveUsageUnionMemberAdded;
  meta: {
    unionName: string;
    addedUnionMemberTypeName: string;
    addedDirectiveName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageUnionMemberRemovedChange = {
  type: typeof ChangeType.DirectiveUsageUnionMemberRemoved;
  meta: {
    unionName: string;
    removedUnionMemberTypeName: string;
    removedDirectiveName: string;
  };
};

export type FieldArgumentAddedChange = {
  type: typeof ChangeType.FieldArgumentAdded;
  meta: {
    typeName: string;
    fieldName: string;
    addedArgumentName: string;
    addedArgumentType: string;
    hasDefaultValue: boolean;
    isAddedFieldArgumentBreaking: boolean;
    addedToNewField: boolean;
  };
};

export type FieldArgumentRemovedChange = {
  type: typeof ChangeType.FieldArgumentRemoved;
  meta: {
    typeName: string;
    fieldName: string;
    removedFieldArgumentName: string;
    removedFieldType: string;
  };
};

// Input

export type InputFieldRemovedChange = {
  type: typeof ChangeType.InputFieldRemoved;
  meta: {
    inputName: string;
    removedFieldName: string;
    isInputFieldDeprecated: boolean;
  };
};

export type InputFieldAddedChange = {
  type: typeof ChangeType.InputFieldAdded;
  meta: {
    inputName: string;
    addedInputFieldName: string;
    isAddedInputFieldTypeNullable: boolean;
    addedInputFieldType: string;
    addedFieldDefault?: string;
    addedToNewType: boolean;
  };
};

export type InputFieldDescriptionAddedChange = {
  type: typeof ChangeType.InputFieldDescriptionAdded;
  meta: {
    inputName: string;
    inputFieldName: string;
    addedInputFieldDescription: string;
  };
};

export type InputFieldDescriptionRemovedChange = {
  type: typeof ChangeType.InputFieldDescriptionRemoved;
  meta: {
    inputName: string;
    inputFieldName: string;
    removedDescription: string;
  };
};

export type InputFieldDescriptionChangedChange = {
  type: typeof ChangeType.InputFieldDescriptionChanged;
  meta: {
    inputName: string;
    inputFieldName: string;
    oldInputFieldDescription: string;
    newInputFieldDescription: string;
  };
};

export type InputFieldDefaultValueChangedChange = {
  type: typeof ChangeType.InputFieldDefaultValueChanged;
  meta: {
    inputName: string;
    inputFieldName: string;
    oldDefaultValue?: string /* null | */;
    newDefaultValue?: string /* null | */;
  };
};

export type InputFieldTypeChangedChange = {
  type: typeof ChangeType.InputFieldTypeChanged;
  meta: {
    inputName: string;
    inputFieldName: string;
    oldInputFieldType: string;
    newInputFieldType: string;
    isInputFieldTypeChangeSafe: boolean;
  };
};

// Type

export type ObjectTypeInterfaceAddedChange = {
  type: typeof ChangeType.ObjectTypeInterfaceAdded;
  meta: {
    objectTypeName: string;
    addedInterfaceName: string;
    addedToNewType: boolean;
  };
};

export type ObjectTypeInterfaceRemovedChange = {
  type: typeof ChangeType.ObjectTypeInterfaceRemoved;
  meta: {
    objectTypeName: string;
    removedInterfaceName: string;
  };
};

// Schema

export type SchemaQueryTypeChangedChange = {
  type: typeof ChangeType.SchemaQueryTypeChanged;
  meta: {
    oldQueryTypeName: string;
    newQueryTypeName: string;
  };
};

export type SchemaMutationTypeChangedChange = {
  type: typeof ChangeType.SchemaMutationTypeChanged;
  meta: {
    oldMutationTypeName: string;
    newMutationTypeName: string;
  };
};

export type SchemaSubscriptionTypeChangedChange = {
  type: typeof ChangeType.SchemaSubscriptionTypeChanged;
  meta: {
    oldSubscriptionTypeName: string;
    newSubscriptionTypeName: string;
  };
};

// Type

export type TypeRemovedChange = {
  type: typeof ChangeType.TypeRemoved;
  meta: {
    removedTypeName: string;
  };
};

type TypeAddedMeta<K extends Kind> = {
  addedTypeName: string;
  addedTypeKind: K;
};

type InputAddedMeta = TypeAddedMeta<Kind.INPUT_OBJECT_TYPE_DEFINITION> & {
  addedTypeIsOneOf: boolean;
};

export type TypeAddedChange = {
  type: typeof ChangeType.TypeAdded;
  meta:
    | InputAddedMeta
    | TypeAddedMeta<
        | Kind.ENUM_TYPE_DEFINITION
        | Kind.OBJECT_TYPE_DEFINITION
        | Kind.INTERFACE_TYPE_DEFINITION
        | Kind.UNION_TYPE_DEFINITION
        | Kind.SCALAR_TYPE_DEFINITION
      >;
};

export type TypeKindChangedChange = {
  type: typeof ChangeType.TypeKindChanged;
  meta: {
    typeName: string;
    oldTypeKind: string;
    newTypeKind: string;
  };
};

export type TypeDescriptionChangedChange = {
  type: typeof ChangeType.TypeDescriptionChanged;
  meta: {
    typeName: string;
    oldTypeDescription: string;
    newTypeDescription: string;
  };
};

export type TypeDescriptionAddedChange = {
  type: typeof ChangeType.TypeDescriptionAdded;
  meta: {
    typeName: string;
    addedTypeDescription: string;
  };
};

export type TypeDescriptionRemovedChange = {
  type: typeof ChangeType.TypeDescriptionRemoved;
  meta: {
    typeName: string;
    removedTypeDescription: string;
  };
};

// Union

export type UnionMemberRemovedChange = {
  type: typeof ChangeType.UnionMemberRemoved;
  meta: {
    unionName: string;
    removedUnionMemberTypeName: string;
  };
};

export type UnionMemberAddedChange = {
  type: typeof ChangeType.UnionMemberAdded;
  meta: {
    unionName: string;
    addedUnionMemberTypeName: string;
    addedToNewType: boolean;
  };
};

// Directive Usage

export type DirectiveUsageEnumAddedChange = {
  type: typeof ChangeType.DirectiveUsageEnumAdded;
  meta: {
    enumName: string;
    addedDirectiveName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageEnumRemovedChange = {
  type: typeof ChangeType.DirectiveUsageEnumRemoved;
  meta: {
    enumName: string;
    removedDirectiveName: string;
  };
};

export type DirectiveUsageEnumValueAddedChange = {
  type: typeof ChangeType.DirectiveUsageEnumValueAdded;
  meta: {
    enumName: string;
    enumValueName: string;
    addedDirectiveName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageEnumValueRemovedChange = {
  type: typeof ChangeType.DirectiveUsageEnumValueRemoved;
  meta: {
    enumName: string;
    enumValueName: string;
    removedDirectiveName: string;
  };
};

export type DirectiveUsageInputObjectRemovedChange = {
  type: typeof ChangeType.DirectiveUsageInputObjectRemoved;
  meta: {
    inputObjectName: string;
    removedInputFieldName: string;
    isRemovedInputFieldTypeNullable: boolean;
    removedInputFieldType: string;
    removedDirectiveName: string;
  };
};

export type DirectiveUsageInputObjectAddedChange = {
  type: typeof ChangeType.DirectiveUsageInputObjectAdded;
  meta: {
    inputObjectName: string;
    addedInputFieldName: string;
    isAddedInputFieldTypeNullable: boolean;
    addedInputFieldType: string;
    addedDirectiveName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageInputFieldDefinitionAddedChange = {
  type: typeof ChangeType.DirectiveUsageInputFieldDefinitionAdded;
  meta: {
    inputObjectName: string;
    inputFieldName: string;
    addedDirectiveName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageInputFieldDefinitionRemovedChange = {
  type: typeof ChangeType.DirectiveUsageInputFieldDefinitionRemoved;
  meta: {
    inputObjectName: string;
    inputFieldName: string;
    removedDirectiveName: string;
  };
};

export type DirectiveUsageFieldAddedChange = {
  type: typeof ChangeType.DirectiveUsageFieldAdded;
  meta: {
    typeName: string;
    fieldName: string;
    addedDirectiveName: string;
  };
};

export type DirectiveUsageFieldRemovedChange = {
  type: typeof ChangeType.DirectiveUsageFieldRemoved;
  meta: {
    typeName: string;
    fieldName: string;
    removedDirectiveName: string;
  };
};

export type DirectiveUsageScalarAddedChange = {
  type: typeof ChangeType.DirectiveUsageScalarAdded;
  meta: {
    scalarName: string;
    addedDirectiveName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageScalarRemovedChange = {
  type: typeof ChangeType.DirectiveUsageScalarRemoved;
  meta: {
    scalarName: string;
    removedDirectiveName: string;
  };
};

export type DirectiveUsageObjectAddedChange = {
  type: typeof ChangeType.DirectiveUsageObjectAdded;
  meta: {
    objectName: string;
    addedDirectiveName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageObjectRemovedChange = {
  type: typeof ChangeType.DirectiveUsageObjectRemoved;
  meta: {
    objectName: string;
    removedDirectiveName: string;
  };
};

export type DirectiveUsageInterfaceAddedChange = {
  type: typeof ChangeType.DirectiveUsageInterfaceAdded;
  meta: {
    interfaceName: string;
    addedDirectiveName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageSchemaAddedChange = {
  type: typeof ChangeType.DirectiveUsageSchemaAdded;
  meta: {
    addedDirectiveName: string;
    schemaTypeName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageSchemaRemovedChange = {
  type: typeof ChangeType.DirectiveUsageSchemaRemoved;
  meta: {
    removedDirectiveName: string;
    schemaTypeName: string;
  };
};

export type DirectiveUsageFieldDefinitionAddedChange = {
  type: typeof ChangeType.DirectiveUsageFieldDefinitionAdded;
  meta: {
    typeName: string;
    fieldName: string;
    addedDirectiveName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageFieldDefinitionRemovedChange = {
  type: typeof ChangeType.DirectiveUsageFieldDefinitionRemoved;
  meta: {
    typeName: string;
    fieldName: string;
    removedDirectiveName: string;
  };
};

export type DirectiveUsageArgumentDefinitionChange = {
  type: typeof ChangeType.DirectiveUsageArgumentDefinitionAdded;
  meta: {
    typeName: string;
    fieldName: string;
    argumentName: string;
    addedDirectiveName: string;
    addedToNewType: boolean;
  };
};

export type DirectiveUsageArgumentDefinitionRemovedChange = {
  type: typeof ChangeType.DirectiveUsageArgumentDefinitionRemoved;
  meta: {
    typeName: string;
    fieldName: string;
    argumentName: string;
    removedDirectiveName: string;
  };
};

export type DirectiveUsageInterfaceRemovedChange = {
  type: typeof ChangeType.DirectiveUsageInterfaceRemoved;
  meta: {
    interfaceName: string;
    removedDirectiveName: string;
  };
};

export type DirectiveUsageArgumentDefinitionAddedChange = {
  type: typeof ChangeType.DirectiveUsageArgumentDefinitionAdded;
  meta: {
    typeName: string;
    fieldName: string;
    argumentName: string;
    addedDirectiveName: string;
  };
};

type Changes = {
  [ChangeType.TypeAdded]: TypeAddedChange;
  [ChangeType.TypeRemoved]: TypeRemovedChange;
  [ChangeType.TypeKindChanged]: TypeKindChangedChange;
  [ChangeType.TypeDescriptionChanged]: TypeDescriptionChangedChange;
  [ChangeType.TypeDescriptionAdded]: TypeDescriptionAddedChange;
  [ChangeType.TypeDescriptionRemoved]: TypeDescriptionRemovedChange;
  [ChangeType.UnionMemberRemoved]: UnionMemberRemovedChange;
  [ChangeType.UnionMemberAdded]: UnionMemberAddedChange;
  [ChangeType.SchemaQueryTypeChanged]: SchemaQueryTypeChangedChange;
  [ChangeType.SchemaMutationTypeChanged]: SchemaMutationTypeChangedChange;
  [ChangeType.SchemaSubscriptionTypeChanged]: SchemaSubscriptionTypeChangedChange;
  [ChangeType.ObjectTypeInterfaceAdded]: ObjectTypeInterfaceAddedChange;
  [ChangeType.ObjectTypeInterfaceRemoved]: ObjectTypeInterfaceRemovedChange;
  [ChangeType.InputFieldRemoved]: InputFieldRemovedChange;
  [ChangeType.InputFieldAdded]: InputFieldAddedChange;
  [ChangeType.InputFieldDescriptionAdded]: InputFieldDescriptionAddedChange;
  [ChangeType.InputFieldDescriptionRemoved]: InputFieldDescriptionRemovedChange;
  [ChangeType.InputFieldDescriptionChanged]: InputFieldDescriptionChangedChange;
  [ChangeType.InputFieldDefaultValueChanged]: InputFieldDefaultValueChangedChange;
  [ChangeType.InputFieldTypeChanged]: InputFieldTypeChangedChange;
  [ChangeType.FieldRemoved]: FieldRemovedChange;
  [ChangeType.FieldAdded]: FieldAddedChange;
  [ChangeType.FieldDescriptionAdded]: FieldDescriptionAddedChange;
  [ChangeType.FieldDescriptionRemoved]: FieldDescriptionRemovedChange;
  [ChangeType.FieldDescriptionChanged]: FieldDescriptionChangedChange;
  [ChangeType.FieldArgumentAdded]: FieldArgumentAddedChange;
  [ChangeType.FieldArgumentRemoved]: FieldArgumentRemovedChange;
  [ChangeType.InputFieldRemoved]: InputFieldRemovedChange;
  [ChangeType.InputFieldAdded]: InputFieldAddedChange;
  [ChangeType.InputFieldDescriptionAdded]: InputFieldDescriptionAddedChange;
  [ChangeType.InputFieldDescriptionRemoved]: InputFieldDescriptionRemovedChange;
  [ChangeType.InputFieldDescriptionChanged]: InputFieldDescriptionChangedChange;
  [ChangeType.InputFieldDefaultValueChanged]: InputFieldDefaultValueChangedChange;
  [ChangeType.InputFieldTypeChanged]: InputFieldTypeChangedChange;
  [ChangeType.ObjectTypeInterfaceAdded]: ObjectTypeInterfaceAddedChange;
  [ChangeType.ObjectTypeInterfaceRemoved]: ObjectTypeInterfaceRemovedChange;
  [ChangeType.SchemaQueryTypeChanged]: SchemaQueryTypeChangedChange;
  [ChangeType.SchemaMutationTypeChanged]: SchemaMutationTypeChangedChange;
  [ChangeType.SchemaSubscriptionTypeChanged]: SchemaSubscriptionTypeChangedChange;
  [ChangeType.TypeAdded]: TypeAddedChange;
  [ChangeType.TypeRemoved]: TypeRemovedChange;
  [ChangeType.TypeKindChanged]: TypeKindChangedChange;
  [ChangeType.TypeDescriptionChanged]: TypeDescriptionChangedChange;
  [ChangeType.TypeDescriptionRemoved]: TypeDescriptionRemovedChange;
  [ChangeType.TypeDescriptionAdded]: TypeDescriptionAddedChange;
  [ChangeType.UnionMemberAdded]: UnionMemberAddedChange;
  [ChangeType.UnionMemberRemoved]: UnionMemberRemovedChange;
  [ChangeType.DirectiveRemoved]: DirectiveRemovedChange;
  [ChangeType.DirectiveAdded]: DirectiveAddedChange;
  [ChangeType.DirectiveArgumentAdded]: DirectiveArgumentAddedChange;
  [ChangeType.DirectiveArgumentRemoved]: DirectiveArgumentRemovedChange;
  [ChangeType.DirectiveArgumentDescriptionChanged]: DirectiveArgumentDescriptionChangedChange;
  [ChangeType.DirectiveArgumentDefaultValueChanged]: DirectiveArgumentDefaultValueChangedChange;
  [ChangeType.DirectiveArgumentTypeChanged]: DirectiveArgumentTypeChangedChange;
  [ChangeType.DirectiveDescriptionChanged]: DirectiveDescriptionChangedChange;
  [ChangeType.FieldArgumentDescriptionChanged]: FieldArgumentDescriptionChangedChange;
  [ChangeType.FieldArgumentDefaultChanged]: FieldArgumentDefaultChangedChange;
  [ChangeType.FieldArgumentTypeChanged]: FieldArgumentTypeChangedChange;
  [ChangeType.DirectiveLocationAdded]: DirectiveLocationAddedChange;
  [ChangeType.DirectiveLocationRemoved]: DirectiveLocationRemovedChange;
  [ChangeType.EnumValueRemoved]: EnumValueRemovedChange;
  [ChangeType.EnumValueDescriptionChanged]: EnumValueDescriptionChangedChange;
  [ChangeType.EnumValueDeprecationReasonChanged]: EnumValueDeprecationReasonChangedChange;
  [ChangeType.EnumValueDeprecationReasonAdded]: EnumValueDeprecationReasonAddedChange;
  [ChangeType.EnumValueDeprecationReasonRemoved]: EnumValueDeprecationReasonRemovedChange;
  [ChangeType.EnumValueAdded]: EnumValueAddedChange;
  [ChangeType.FieldDeprecationAdded]: FieldDeprecationAddedChange;
  [ChangeType.FieldDeprecationRemoved]: FieldDeprecationRemovedChange;
  [ChangeType.FieldDeprecationReasonChanged]: FieldDeprecationReasonChangedChange;
  [ChangeType.FieldDeprecationReasonAdded]: FieldDeprecationReasonAddedChange;
  [ChangeType.FieldDeprecationReasonRemoved]: FieldDeprecationReasonRemovedChange;
  [ChangeType.FieldTypeChanged]: FieldTypeChangedChange;
  [ChangeType.DirectiveUsageUnionMemberAdded]: DirectiveUsageUnionMemberAddedChange;
  [ChangeType.DirectiveUsageUnionMemberRemoved]: DirectiveUsageUnionMemberRemovedChange;
  [ChangeType.DirectiveUsageEnumAdded]: DirectiveUsageEnumAddedChange;
  [ChangeType.DirectiveUsageEnumRemoved]: DirectiveUsageEnumRemovedChange;
  [ChangeType.DirectiveUsageEnumValueAdded]: DirectiveUsageEnumValueAddedChange;
  [ChangeType.DirectiveUsageEnumValueRemoved]: DirectiveUsageEnumValueRemovedChange;
  [ChangeType.DirectiveUsageInputObjectAdded]: DirectiveUsageInputObjectAddedChange;
  [ChangeType.DirectiveUsageInputObjectRemoved]: DirectiveUsageInputObjectRemovedChange;
  [ChangeType.DirectiveUsageFieldAdded]: DirectiveUsageFieldAddedChange;
  [ChangeType.DirectiveUsageFieldRemoved]: DirectiveUsageFieldRemovedChange;
  [ChangeType.DirectiveUsageScalarAdded]: DirectiveUsageScalarAddedChange;
  [ChangeType.DirectiveUsageScalarRemoved]: DirectiveUsageScalarRemovedChange;
  [ChangeType.DirectiveUsageObjectAdded]: DirectiveUsageObjectAddedChange;
  [ChangeType.DirectiveUsageObjectRemoved]: DirectiveUsageObjectRemovedChange;
  [ChangeType.DirectiveUsageInterfaceAdded]: DirectiveUsageInterfaceAddedChange;
  [ChangeType.DirectiveUsageInterfaceRemoved]: DirectiveUsageInterfaceRemovedChange;
  [ChangeType.DirectiveUsageArgumentDefinitionAdded]: DirectiveUsageArgumentDefinitionAddedChange;
  [ChangeType.DirectiveUsageArgumentDefinitionRemoved]: DirectiveUsageArgumentDefinitionRemovedChange;
  [ChangeType.DirectiveUsageSchemaAdded]: DirectiveUsageSchemaAddedChange;
  [ChangeType.DirectiveUsageSchemaRemoved]: DirectiveUsageSchemaRemovedChange;
  [ChangeType.DirectiveUsageFieldDefinitionAdded]: DirectiveUsageFieldDefinitionAddedChange;
  [ChangeType.DirectiveUsageFieldDefinitionRemoved]: DirectiveUsageFieldDefinitionRemovedChange;
  [ChangeType.DirectiveUsageInputFieldDefinitionAdded]: DirectiveUsageInputFieldDefinitionAddedChange;
  [ChangeType.DirectiveUsageInputFieldDefinitionRemoved]: DirectiveUsageInputFieldDefinitionRemovedChange;
};

export type SerializableChange = Changes[keyof Changes];
