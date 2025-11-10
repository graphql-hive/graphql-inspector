import {
  ConstDirectiveNode,
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLInputField,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLUnionType,
  Kind,
} from 'graphql';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  DirectiveUsageArgumentDefinitionChange,
  DirectiveUsageArgumentDefinitionRemovedChange,
  DirectiveUsageEnumAddedChange,
  DirectiveUsageEnumRemovedChange,
  DirectiveUsageEnumValueAddedChange,
  DirectiveUsageEnumValueRemovedChange,
  DirectiveUsageFieldAddedChange,
  DirectiveUsageFieldDefinitionAddedChange,
  DirectiveUsageFieldDefinitionRemovedChange,
  DirectiveUsageFieldRemovedChange,
  DirectiveUsageInputFieldDefinitionAddedChange,
  DirectiveUsageInputFieldDefinitionRemovedChange,
  DirectiveUsageInputObjectAddedChange,
  DirectiveUsageInputObjectRemovedChange,
  DirectiveUsageInterfaceAddedChange,
  DirectiveUsageInterfaceRemovedChange,
  DirectiveUsageObjectAddedChange,
  DirectiveUsageObjectRemovedChange,
  DirectiveUsageScalarAddedChange,
  DirectiveUsageScalarRemovedChange,
  DirectiveUsageSchemaAddedChange,
  DirectiveUsageSchemaRemovedChange,
  DirectiveUsageUnionMemberAddedChange,
  DirectiveUsageUnionMemberRemovedChange,
} from './change.js';

function addedSpecialDirective(
  directiveName: string,
  forceReturn: CriticalityLevel,
): CriticalityLevel {
  if (directiveName === 'deprecated') {
    return CriticalityLevel.NonBreaking;
  }
  if (directiveName === 'oneOf') {
    return CriticalityLevel.Breaking;
  }
  return forceReturn;
}

function removedSpecialDirective(
  directiveName: string,
  forceReturn: CriticalityLevel,
): CriticalityLevel {
  if (directiveName === 'deprecated') {
    return CriticalityLevel.NonBreaking;
  }
  if (directiveName === 'oneOf') {
    return CriticalityLevel.NonBreaking;
  }
  return forceReturn;
}

type KindToPayload = {
  [Kind.ENUM_TYPE_DEFINITION]: {
    input: GraphQLEnumType;
    change: DirectiveUsageEnumAddedChange | DirectiveUsageEnumRemovedChange;
  };
  [Kind.FIELD_DEFINITION]: {
    input: {
      field: GraphQLField<any, any, any>;
      parentType: GraphQLInterfaceType | GraphQLObjectType<any, any>;
    };
    change: DirectiveUsageFieldDefinitionAddedChange | DirectiveUsageFieldDefinitionRemovedChange;
  };
  [Kind.UNION_TYPE_DEFINITION]: {
    input: GraphQLUnionType;
    change: DirectiveUsageUnionMemberAddedChange | DirectiveUsageUnionMemberRemovedChange;
  };
  [Kind.ENUM_VALUE_DEFINITION]: {
    input: {
      type: GraphQLEnumType;
      value: GraphQLEnumValue;
    };
    change: DirectiveUsageEnumValueAddedChange | DirectiveUsageEnumValueRemovedChange;
  };
  [Kind.SCHEMA_DEFINITION]: {
    input: GraphQLSchema;
    change: DirectiveUsageSchemaAddedChange | DirectiveUsageSchemaRemovedChange;
  };
  [Kind.SCALAR_TYPE_DEFINITION]: {
    input: GraphQLScalarType;
    change: DirectiveUsageScalarAddedChange | DirectiveUsageScalarRemovedChange;
  };
  [Kind.OBJECT]: {
    input: GraphQLObjectType;
    change: DirectiveUsageObjectAddedChange | DirectiveUsageObjectRemovedChange;
  };
  [Kind.INTERFACE_TYPE_DEFINITION]: {
    input: GraphQLInterfaceType;
    change: DirectiveUsageInterfaceAddedChange | DirectiveUsageInterfaceRemovedChange;
  };
  [Kind.INPUT_OBJECT_TYPE_DEFINITION]: {
    input: GraphQLInputObjectType;
    change: DirectiveUsageInputObjectAddedChange | DirectiveUsageInputObjectRemovedChange;
  };
  [Kind.INPUT_VALUE_DEFINITION]: {
    input: {
      field: GraphQLInputField;
      type: GraphQLInputObjectType;
    };
    change: DirectiveUsageArgumentDefinitionChange | DirectiveUsageArgumentDefinitionRemovedChange;
  };
  [Kind.ARGUMENT]: {
    input: {
      field: GraphQLField<any, any, any>;
      type: GraphQLObjectType | GraphQLInterfaceType;
      argument: GraphQLArgument;
    };
    change: DirectiveUsageArgumentDefinitionChange | DirectiveUsageArgumentDefinitionRemovedChange;
  };
};

function buildDirectiveUsageArgumentDefinitionAddedMessage(
  args: DirectiveUsageArgumentDefinitionChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to argument '${args.argumentName}' of field '${args.fieldName}' in type '${args.typeName}'`;
}

export function directiveUsageArgumentDefinitionAddedFromMeta(
  args: DirectiveUsageArgumentDefinitionChange,
) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to argument '${args.meta.argumentName}'`,
    },
    type: ChangeType.DirectiveUsageArgumentDefinitionAdded,
    message: buildDirectiveUsageArgumentDefinitionAddedMessage(args.meta),
    path: [
      args.meta.typeName,
      args.meta.fieldName,
      args.meta.argumentName,
      args.meta.addedDirectiveName,
    ].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageArgumentDefinitionRemovedMessage(
  args: DirectiveUsageArgumentDefinitionRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from argument '${args.argumentName}' of field '${args.fieldName}' in type '${args.typeName}'`;
}

export function directiveUsageArgumentDefinitionRemovedFromMeta(
  args: DirectiveUsageArgumentDefinitionRemovedChange,
) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from argument '${args.meta.argumentName}'`,
    },
    type: ChangeType.DirectiveUsageArgumentDefinitionRemoved,
    message: buildDirectiveUsageArgumentDefinitionRemovedMessage(args.meta),
    path: [
      args.meta.typeName,
      args.meta.fieldName,
      args.meta.argumentName,
      args.meta.removedDirectiveName,
    ].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageInputObjectAddedMessage(
  args: DirectiveUsageInputObjectAddedChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to input object '${args.inputObjectName}'`;
}

export function directiveUsageInputObjectAddedFromMeta(args: DirectiveUsageInputObjectAddedChange) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to input object '${args.meta.inputObjectName}'`,
    },
    type: ChangeType.DirectiveUsageInputObjectAdded,
    message: buildDirectiveUsageInputObjectAddedMessage(args.meta),
    path: [args.meta.inputObjectName, args.meta.addedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageInputObjectRemovedMessage(
  args: DirectiveUsageInputObjectRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from input object '${args.inputObjectName}'`;
}

export function directiveUsageInputObjectRemovedFromMeta(
  args: DirectiveUsageInputObjectRemovedChange,
) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from input object '${args.meta.inputObjectName}'`,
    },
    type: ChangeType.DirectiveUsageInputObjectRemoved,
    message: buildDirectiveUsageInputObjectRemovedMessage(args.meta),
    path: [args.meta.inputObjectName, args.meta.removedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageInterfaceAddedMessage(
  args: DirectiveUsageInterfaceAddedChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to interface '${args.interfaceName}'`;
}

export function directiveUsageInterfaceAddedFromMeta(args: DirectiveUsageInterfaceAddedChange) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to interface '${args.meta.interfaceName}'`,
    },
    type: ChangeType.DirectiveUsageInterfaceAdded,
    message: buildDirectiveUsageInterfaceAddedMessage(args.meta),
    path: [args.meta.interfaceName, args.meta.addedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageInterfaceRemovedMessage(
  args: DirectiveUsageInterfaceRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from interface '${args.interfaceName}'`;
}

export function directiveUsageInterfaceRemovedFromMeta(args: DirectiveUsageInterfaceRemovedChange) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from interface '${args.meta.interfaceName}'`,
    },
    type: ChangeType.DirectiveUsageInterfaceRemoved,
    message: buildDirectiveUsageInterfaceRemovedMessage(args.meta),
    path: [args.meta.interfaceName, args.meta.removedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageInputFieldDefinitionAddedMessage(
  args: DirectiveUsageInputFieldDefinitionAddedChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to input field '${args.inputFieldName}' in input object '${args.inputObjectName}'`;
}

export function directiveUsageInputFieldDefinitionAddedFromMeta(
  args: DirectiveUsageInputFieldDefinitionAddedChange,
) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to input field '${args.meta.inputFieldName}'`,
    },
    type: ChangeType.DirectiveUsageInputFieldDefinitionAdded,
    message: buildDirectiveUsageInputFieldDefinitionAddedMessage(args.meta),
    path: [args.meta.inputObjectName, args.meta.inputFieldName, args.meta.addedDirectiveName].join(
      '.',
    ),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageInputFieldDefinitionRemovedMessage(
  args: DirectiveUsageInputFieldDefinitionRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from input field '${args.inputFieldName}' in input object '${args.inputObjectName}'`;
}

export function directiveUsageInputFieldDefinitionRemovedFromMeta(
  args: DirectiveUsageInputFieldDefinitionRemovedChange,
) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from input field '${args.meta.inputFieldName}'`,
    },
    type: ChangeType.DirectiveUsageInputFieldDefinitionRemoved,
    message: buildDirectiveUsageInputFieldDefinitionRemovedMessage(args.meta),
    path: [
      args.meta.inputObjectName,
      args.meta.inputFieldName,
      args.meta.removedDirectiveName,
    ].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageObjectAddedMessage(
  args: DirectiveUsageObjectAddedChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to object '${args.objectName}'`;
}

export function directiveUsageObjectAddedFromMeta(args: DirectiveUsageObjectAddedChange) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to object '${args.meta.objectName}'`,
    },
    type: ChangeType.DirectiveUsageObjectAdded,
    message: buildDirectiveUsageObjectAddedMessage(args.meta),
    path: [args.meta.objectName, args.meta.addedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageObjectRemovedMessage(
  args: DirectiveUsageObjectRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from object '${args.objectName}'`;
}

export function directiveUsageObjectRemovedFromMeta(args: DirectiveUsageObjectRemovedChange) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from object '${args.meta.objectName}'`,
    },
    type: ChangeType.DirectiveUsageObjectRemoved,
    message: buildDirectiveUsageObjectRemovedMessage(args.meta),
    path: [args.meta.objectName, args.meta.removedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageEnumAddedMessage(args: DirectiveUsageEnumAddedChange['meta']): string {
  return `Directive '${args.addedDirectiveName}' was added to enum '${args.enumName}'`;
}

export function directiveUsageEnumAddedFromMeta(args: DirectiveUsageEnumAddedChange) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to enum '${args.meta.enumName}'`,
    },
    type: ChangeType.DirectiveUsageEnumAdded,
    message: buildDirectiveUsageEnumAddedMessage(args.meta),
    path: [args.meta.enumName, args.meta.addedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageEnumRemovedMessage(
  args: DirectiveUsageEnumRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from enum '${args.enumName}'`;
}

export function directiveUsageEnumRemovedFromMeta(args: DirectiveUsageEnumRemovedChange) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from enum '${args.meta.enumName}'`,
    },
    type: ChangeType.DirectiveUsageEnumRemoved,
    message: buildDirectiveUsageEnumRemovedMessage(args.meta),
    path: [args.meta.enumName, args.meta.removedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageFieldAddedMessage(
  args: DirectiveUsageFieldAddedChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to field '${args.typeName}.${args.fieldName}'`;
}

export function directiveUsageFieldAddedFromMeta(args: DirectiveUsageFieldAddedChange) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to field '${args.meta.fieldName}'`,
    },
    type: ChangeType.DirectiveUsageFieldAdded,
    message: buildDirectiveUsageFieldAddedMessage(args.meta),
    path: [args.meta.typeName, args.meta.fieldName, args.meta.addedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageFieldDefinitionAddedMessage(
  args: DirectiveUsageFieldDefinitionAddedChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to field '${args.typeName}.${args.fieldName}'`;
}

export function directiveUsageFieldDefinitionAddedFromMeta(
  args: DirectiveUsageFieldDefinitionAddedChange,
) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to field '${args.meta.fieldName}'`,
    },
    type: ChangeType.DirectiveUsageFieldDefinitionAdded,
    message: buildDirectiveUsageFieldDefinitionAddedMessage(args.meta),
    path: [args.meta.typeName, args.meta.fieldName, args.meta.addedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageFieldRemovedMessage(
  args: DirectiveUsageFieldRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from field '${args.typeName}.${args.fieldName}'`;
}

export function directiveUsageFieldRemovedFromMeta(args: DirectiveUsageFieldRemovedChange) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from field '${args.meta.fieldName}'`,
    },
    type: ChangeType.DirectiveUsageFieldRemoved,
    message: buildDirectiveUsageFieldRemovedMessage(args.meta),
    path: [args.meta.typeName, args.meta.fieldName, args.meta.removedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageFieldDefinitionRemovedMessage(
  args: DirectiveUsageFieldDefinitionRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from field '${args.typeName}.${args.fieldName}'`;
}

export function directiveUsageFieldDefinitionRemovedFromMeta(
  args: DirectiveUsageFieldDefinitionRemovedChange,
) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from field '${args.meta.fieldName}'`,
    },
    type: ChangeType.DirectiveUsageFieldDefinitionRemoved,
    message: buildDirectiveUsageFieldDefinitionRemovedMessage(args.meta),
    path: [args.meta.typeName, args.meta.fieldName, args.meta.removedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageEnumValueAddedMessage(
  args: DirectiveUsageEnumValueAddedChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to enum value '${args.enumName}.${args.enumValueName}'`;
}

export function directiveUsageEnumValueAddedFromMeta(args: DirectiveUsageEnumValueAddedChange) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to enum value '${args.meta.enumName}.${args.meta.enumValueName}'`,
    },
    type: ChangeType.DirectiveUsageEnumValueAdded,
    message: buildDirectiveUsageEnumValueAddedMessage(args.meta),
    path: [args.meta.enumName, args.meta.enumValueName, args.meta.addedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageEnumValueRemovedMessage(
  args: DirectiveUsageEnumValueRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from enum value '${args.enumName}.${args.enumValueName}'`;
}

export function directiveUsageEnumValueRemovedFromMeta(args: DirectiveUsageEnumValueRemovedChange) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from enum value '${args.meta.enumName}.${args.meta.enumValueName}'`,
    },
    type: ChangeType.DirectiveUsageEnumValueRemoved,
    message: buildDirectiveUsageEnumValueRemovedMessage(args.meta),
    path: [args.meta.enumName, args.meta.enumValueName, args.meta.removedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageSchemaAddedMessage(
  args: DirectiveUsageSchemaAddedChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to schema '${args.schemaTypeName}'`;
}

export function directiveUsageSchemaAddedFromMeta(args: DirectiveUsageSchemaAddedChange) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to schema '${args.meta.schemaTypeName}'`,
    },
    type: ChangeType.DirectiveUsageSchemaAdded,
    message: buildDirectiveUsageSchemaAddedMessage(args.meta),
    path: [args.meta.schemaTypeName, args.meta.addedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageSchemaRemovedMessage(
  args: DirectiveUsageSchemaRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from schema '${args.schemaTypeName}'`;
}

export function directiveUsageSchemaRemovedFromMeta(args: DirectiveUsageSchemaRemovedChange) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from schema '${args.meta.schemaTypeName}'`,
    },
    type: ChangeType.DirectiveUsageSchemaRemoved,
    message: buildDirectiveUsageSchemaRemovedMessage(args.meta),
    path: [args.meta.schemaTypeName, args.meta.removedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageScalarAddedMessage(
  args: DirectiveUsageScalarAddedChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to scalar '${args.scalarName}'`;
}

export function directiveUsageScalarAddedFromMeta(args: DirectiveUsageScalarAddedChange) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to scalar '${args.meta.scalarName}'`,
    },
    type: ChangeType.DirectiveUsageScalarAdded,
    message: buildDirectiveUsageScalarAddedMessage(args.meta),
    path: [args.meta.scalarName, args.meta.addedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageScalarRemovedMessage(
  args: DirectiveUsageScalarRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from scalar '${args.scalarName}'`;
}

export function directiveUsageScalarRemovedFromMeta(args: DirectiveUsageScalarRemovedChange) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from scalar '${args.meta.scalarName}'`,
    },
    type: ChangeType.DirectiveUsageScalarRemoved,
    message: buildDirectiveUsageScalarRemovedMessage(args.meta),
    path: [args.meta.scalarName, args.meta.removedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageUnionMemberAddedMessage(
  args: DirectiveUsageUnionMemberAddedChange['meta'],
): string {
  return `Directive '${args.addedDirectiveName}' was added to union member '${args.unionName}'`;
}

export function directiveUsageUnionMemberAddedFromMeta(args: DirectiveUsageUnionMemberAddedChange) {
  return {
    criticality: {
      level: addedSpecialDirective(args.meta.addedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.addedDirectiveName}' was added to union member '${args.meta.unionName}.${args.meta.addedUnionMemberTypeName}'`,
    },
    type: ChangeType.DirectiveUsageUnionMemberAdded,
    message: buildDirectiveUsageUnionMemberAddedMessage(args.meta),
    path: [args.meta.unionName, args.meta.addedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

function buildDirectiveUsageUnionMemberRemovedMessage(
  args: DirectiveUsageUnionMemberRemovedChange['meta'],
): string {
  return `Directive '${args.removedDirectiveName}' was removed from union member '${args.unionName}'`;
}

export function directiveUsageUnionMemberRemovedFromMeta(
  args: DirectiveUsageUnionMemberRemovedChange,
) {
  return {
    criticality: {
      level: removedSpecialDirective(args.meta.removedDirectiveName, CriticalityLevel.Dangerous),
      reason: `Directive '${args.meta.removedDirectiveName}' was removed from union member '${args.meta.unionName}.${args.meta.removedUnionMemberTypeName}'`,
    },
    type: ChangeType.DirectiveUsageUnionMemberRemoved,
    message: buildDirectiveUsageUnionMemberRemovedMessage(args.meta),
    path: [args.meta.unionName, args.meta.removedDirectiveName].join('.'),
    meta: args.meta,
  } as const;
}

export function directiveUsageAdded<K extends keyof KindToPayload>(
  kind: K,
  directive: ConstDirectiveNode,
  payload: KindToPayload[K]['input'],
): Change {
  if (isOfKind(kind, Kind.ARGUMENT, payload)) {
    return directiveUsageArgumentDefinitionAddedFromMeta({
      type: ChangeType.DirectiveUsageArgumentDefinitionAdded,
      meta: {
        addedDirectiveName: directive.name.value,
        argumentName: payload.argument.name,
        fieldName: payload.field.name,
        typeName: payload.type.name,
      },
    });
  }
  if (isOfKind(kind, Kind.INPUT_VALUE_DEFINITION, payload)) {
    return directiveUsageInputFieldDefinitionAddedFromMeta({
      type: ChangeType.DirectiveUsageInputFieldDefinitionAdded,
      meta: {
        addedDirectiveName: directive.name.value,
        inputFieldName: payload.field.name,
        inputObjectName: payload.type.name,
      },
    });
  }
  if (isOfKind(kind, Kind.INPUT_OBJECT_TYPE_DEFINITION, payload)) {
    return directiveUsageInputObjectAddedFromMeta({
      type: ChangeType.DirectiveUsageInputObjectAdded,
      meta: {
        addedDirectiveName: directive.name.value,
        addedInputFieldName: directive.name.value,
        addedInputFieldType: payload.name,
        inputObjectName: payload.name,
        isAddedInputFieldTypeNullable: kind === Kind.INPUT_VALUE_DEFINITION,
      },
    });
  }
  if (isOfKind(kind, Kind.INTERFACE_TYPE_DEFINITION, payload)) {
    return directiveUsageInterfaceAddedFromMeta({
      type: ChangeType.DirectiveUsageInterfaceAdded,
      meta: {
        addedDirectiveName: directive.name.value,
        interfaceName: payload.name,
      },
    });
  }
  if (isOfKind(kind, Kind.OBJECT, payload)) {
    return directiveUsageObjectAddedFromMeta({
      type: ChangeType.DirectiveUsageObjectAdded,
      meta: {
        objectName: payload.name,
        addedDirectiveName: directive.name.value,
      },
    });
  }
  if (isOfKind(kind, Kind.ENUM_TYPE_DEFINITION, payload)) {
    return directiveUsageEnumAddedFromMeta({
      type: ChangeType.DirectiveUsageEnumAdded,
      meta: {
        enumName: payload.name,
        addedDirectiveName: directive.name.value,
      },
    });
  }
  if (isOfKind(kind, Kind.FIELD_DEFINITION, payload)) {
    return directiveUsageFieldDefinitionAddedFromMeta({
      type: ChangeType.DirectiveUsageFieldDefinitionAdded,
      meta: {
        addedDirectiveName: directive.name.value,
        fieldName: payload.field.name,
        typeName: payload.parentType.name,
      },
    });
  }
  if (isOfKind(kind, Kind.UNION_TYPE_DEFINITION, payload)) {
    return directiveUsageUnionMemberAddedFromMeta({
      type: ChangeType.DirectiveUsageUnionMemberAdded,
      meta: {
        addedDirectiveName: directive.name.value,
        addedUnionMemberTypeName: payload.name,
        unionName: payload.name,
      },
    });
  }
  if (isOfKind(kind, Kind.ENUM_VALUE_DEFINITION, payload)) {
    return directiveUsageEnumValueAddedFromMeta({
      type: ChangeType.DirectiveUsageEnumValueAdded,
      meta: {
        enumName: payload.type.name,
        enumValueName: payload.value.name,
        addedDirectiveName: directive.name.value,
      },
    });
  }
  if (isOfKind(kind, Kind.SCHEMA_DEFINITION, payload)) {
    return directiveUsageSchemaAddedFromMeta({
      type: ChangeType.DirectiveUsageSchemaAdded,
      meta: {
        addedDirectiveName: directive.name.value,
        schemaTypeName: payload.getQueryType()?.name || '',
      },
    });
  }
  if (isOfKind(kind, Kind.SCALAR_TYPE_DEFINITION, payload)) {
    return directiveUsageScalarAddedFromMeta({
      type: ChangeType.DirectiveUsageScalarAdded,
      meta: {
        scalarName: payload.name,
        addedDirectiveName: directive.name.value,
      },
    });
  }

  return {} as any;
}

export function directiveUsageRemoved<K extends keyof KindToPayload>(
  kind: K,
  directive: ConstDirectiveNode,
  payload: KindToPayload[K]['input'],
): Change {
  if (isOfKind(kind, Kind.ARGUMENT, payload)) {
    return directiveUsageArgumentDefinitionRemovedFromMeta({
      type: ChangeType.DirectiveUsageArgumentDefinitionRemoved,
      meta: {
        removedDirectiveName: directive.name.value,
        argumentName: payload.argument.name,
        fieldName: payload.field.name,
        typeName: payload.type.name,
      },
    });
  }
  if (isOfKind(kind, Kind.INPUT_VALUE_DEFINITION, payload)) {
    return directiveUsageInputFieldDefinitionRemovedFromMeta({
      type: ChangeType.DirectiveUsageInputFieldDefinitionRemoved,
      meta: {
        removedDirectiveName: directive.name.value,
        inputFieldName: payload.field.name,
        inputObjectName: payload.type.name,
      },
    });
  }
  if (isOfKind(kind, Kind.INPUT_OBJECT_TYPE_DEFINITION, payload)) {
    return directiveUsageInputObjectRemovedFromMeta({
      type: ChangeType.DirectiveUsageInputObjectRemoved,
      meta: {
        removedDirectiveName: directive.name.value,
        removedInputFieldName: directive.name.value,
        removedInputFieldType: payload.name,
        inputObjectName: payload.name,
        isRemovedInputFieldTypeNullable: kind === Kind.INPUT_VALUE_DEFINITION,
      },
    });
  }
  if (isOfKind(kind, Kind.INTERFACE_TYPE_DEFINITION, payload)) {
    return directiveUsageInterfaceRemovedFromMeta({
      type: ChangeType.DirectiveUsageInterfaceRemoved,
      meta: {
        removedDirectiveName: directive.name.value,
        interfaceName: payload.name,
      },
    });
  }
  if (isOfKind(kind, Kind.OBJECT, payload)) {
    return directiveUsageObjectRemovedFromMeta({
      type: ChangeType.DirectiveUsageObjectRemoved,
      meta: {
        objectName: payload.name,
        removedDirectiveName: directive.name.value,
      },
    });
  }
  if (isOfKind(kind, Kind.ENUM_TYPE_DEFINITION, payload)) {
    return directiveUsageEnumRemovedFromMeta({
      type: ChangeType.DirectiveUsageEnumRemoved,
      meta: {
        enumName: payload.name,
        removedDirectiveName: directive.name.value,
      },
    });
  }
  if (isOfKind(kind, Kind.FIELD_DEFINITION, payload)) {
    return directiveUsageFieldDefinitionRemovedFromMeta({
      type: ChangeType.DirectiveUsageFieldDefinitionRemoved,
      meta: {
        removedDirectiveName: directive.name.value,
        fieldName: payload.field.name,
        typeName: payload.parentType.name,
      },
    });
  }
  if (isOfKind(kind, Kind.UNION_TYPE_DEFINITION, payload)) {
    return directiveUsageUnionMemberRemovedFromMeta({
      type: ChangeType.DirectiveUsageUnionMemberRemoved,
      meta: {
        removedDirectiveName: directive.name.value,
        removedUnionMemberTypeName: payload.name,
        unionName: payload.name,
      },
    });
  }
  if (isOfKind(kind, Kind.ENUM_VALUE_DEFINITION, payload)) {
    return directiveUsageEnumValueRemovedFromMeta({
      type: ChangeType.DirectiveUsageEnumValueRemoved,
      meta: {
        enumName: payload.type.name,
        enumValueName: payload.value.name,
        removedDirectiveName: directive.name.value,
      },
    });
  }
  if (isOfKind(kind, Kind.SCHEMA_DEFINITION, payload)) {
    return directiveUsageSchemaRemovedFromMeta({
      type: ChangeType.DirectiveUsageSchemaRemoved,
      meta: {
        removedDirectiveName: directive.name.value,
        schemaTypeName: payload.getQueryType()?.name || '',
      },
    });
  }
  if (isOfKind(kind, Kind.SCALAR_TYPE_DEFINITION, payload)) {
    return directiveUsageScalarRemovedFromMeta({
      type: ChangeType.DirectiveUsageScalarRemoved,
      meta: {
        scalarName: payload.name,
        removedDirectiveName: directive.name.value,
      },
    });
  }

  return {} as any;
}

function isOfKind<K extends keyof KindToPayload>(
  kind: keyof KindToPayload,
  expectedKind: K,
  _value: any,
): _value is KindToPayload[K]['input'] {
  return kind === expectedKind;
}
