import {
  GraphQLArgument,
  GraphQLDeprecatedDirective,
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  isInterfaceType,
  isNonNullType,
  print,
} from 'graphql';
import { safeChangeForField } from '../../utils/graphql.js';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  FieldAddedChange,
  FieldArgumentAddedChange,
  FieldArgumentRemovedChange,
  FieldDeprecationAddedChange,
  FieldDeprecationReasonAddedChange,
  FieldDeprecationReasonChangedChange,
  FieldDeprecationReasonRemovedChange,
  FieldDeprecationRemovedChange,
  FieldDescriptionAddedChange,
  FieldDescriptionChangedChange,
  FieldDescriptionRemovedChange,
  FieldRemovedChange,
  FieldTypeChangedChange,
} from './change.js';

function buildFieldRemovedMessage(args: FieldRemovedChange['meta']) {
  return `Field '${args.removedFieldName}' ${
    args.isRemovedFieldDeprecated ? '(deprecated) ' : ''
  }was removed from ${args.typeType} '${args.typeName}'`;
}

export function fieldRemovedFromMeta(args: FieldRemovedChange) {
  return {
    type: ChangeType.FieldRemoved,
    criticality: {
      level: CriticalityLevel.Breaking,
      reason: args.meta.isRemovedFieldDeprecated
        ? `Removing a deprecated field is a breaking change. Before removing it, you may want to look at the field's usage to see the impact of removing the field.`
        : `Removing a field is a breaking change. It is preferable to deprecate the field before removing it. This applies to removed union fields as well, since removal breaks client operations that contain fragments that reference the removed type through direct (... on RemovedType) or indirect means such as __typename in the consumers.`,
    },
    message: buildFieldRemovedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.removedFieldName].join('.'),
  } as const;
}

export function fieldRemoved(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
): Change<typeof ChangeType.FieldRemoved> {
  const entity = isInterfaceType(type) ? 'interface' : 'object type';
  return fieldRemovedFromMeta({
    type: ChangeType.FieldRemoved,
    meta: {
      typeName: type.name,
      removedFieldName: field.name,
      isRemovedFieldDeprecated: field.deprecationReason != null,
      typeType: entity,
    },
  });
}

function buildFieldAddedMessage(args: FieldAddedChange['meta']) {
  return `Field '${args.addedFieldName}' was added to ${args.typeType} '${args.typeName}'`;
}

export function fieldAddedFromMeta(args: FieldAddedChange) {
  return {
    type: ChangeType.FieldAdded,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldAddedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.addedFieldName].join('.'),
  } as const;
}

export function fieldAdded(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
): Change<typeof ChangeType.FieldAdded> {
  const entity = isInterfaceType(type) ? 'interface' : 'object type';
  return fieldAddedFromMeta({
    type: ChangeType.FieldAdded,
    meta: {
      typeName: type.name,
      addedFieldName: field.name,
      typeType: entity,
      addedFieldReturnType: field.astNode?.type ? print(field.astNode?.type) : '',
    },
  });
}

function buildFieldDescriptionChangedMessage(args: FieldDescriptionChangedChange['meta']) {
  return `Field '${args.typeName}.${args.fieldName}' description changed from '${args.oldDescription}' to '${args.newDescription}'`;
}

export function fieldDescriptionChangedFromMeta(args: FieldDescriptionChangedChange) {
  return {
    type: ChangeType.FieldDescriptionChanged,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldDescriptionChangedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName].join('.'),
  } as const;
}

export function fieldDescriptionChanged(
  type: GraphQLObjectType | GraphQLInterfaceType,
  oldField: GraphQLField<any, any>,
  newField: GraphQLField<any, any>,
): Change<typeof ChangeType.FieldDescriptionChanged> {
  return fieldDescriptionChangedFromMeta({
    type: ChangeType.FieldDescriptionChanged,
    meta: {
      fieldName: oldField.name,
      typeName: type.name,
      oldDescription: oldField.description ?? '',
      newDescription: newField.description ?? '',
    },
  });
}

function buildFieldDescriptionAddedMessage(args: FieldDescriptionAddedChange['meta']) {
  return `Field '${args.typeName}.${args.fieldName}' has description '${args.addedDescription}'`;
}

export function fieldDescriptionAddedFromMeta(args: FieldDescriptionAddedChange) {
  return {
    type: ChangeType.FieldDescriptionAdded,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldDescriptionAddedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName].join('.'),
  } as const;
}

export function fieldDescriptionAdded(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any>,
): Change<typeof ChangeType.FieldDescriptionAdded> {
  return fieldDescriptionAddedFromMeta({
    type: ChangeType.FieldDescriptionAdded,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      addedDescription: field.description ?? '',
    },
  });
}

function buildFieldDescriptionRemovedMessage(args: FieldDescriptionRemovedChange['meta']) {
  return `Description was removed from field '${args.typeName}.${args.fieldName}'`;
}

export function fieldDescriptionRemovedFromMeta(args: FieldDescriptionRemovedChange) {
  return {
    type: ChangeType.FieldDescriptionRemoved,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldDescriptionRemovedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName].join('.'),
  } as const;
}

export function fieldDescriptionRemoved(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any>,
): Change<typeof ChangeType.FieldDescriptionRemoved> {
  return fieldDescriptionRemovedFromMeta({
    type: ChangeType.FieldDescriptionRemoved,
    meta: {
      typeName: type.name,
      fieldName: field.name,
    },
  });
}

function buildFieldDeprecatedAddedMessage(args: FieldDeprecationAddedChange['meta']) {
  return `Field '${args.typeName}.${args.fieldName}' is deprecated`;
}

export function fieldDeprecationAddedFromMeta(args: FieldDeprecationAddedChange) {
  return {
    type: ChangeType.FieldDeprecationAdded,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldDeprecatedAddedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName].join('.'),
  } as const;
}

export function fieldDeprecationAdded(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any>,
): Change<typeof ChangeType.FieldDeprecationAdded> {
  return fieldDeprecationAddedFromMeta({
    type: ChangeType.FieldDeprecationAdded,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      deprecationReason: field.deprecationReason ?? '',
    },
  });
}

export function fieldDeprecationRemovedFromMeta(args: FieldDeprecationRemovedChange) {
  return {
    type: ChangeType.FieldDeprecationRemoved,
    criticality: {
      // @todo: Add a reason for why is this dangerous... Why is it??
      level: CriticalityLevel.Dangerous,
    },
    message: `Field '${args.meta.typeName}.${args.meta.fieldName}' is no longer deprecated`,
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName].join('.'),
  } as const;
}

export function fieldDeprecationRemoved(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any>,
): Change<typeof ChangeType.FieldDeprecationRemoved> {
  return fieldDeprecationRemovedFromMeta({
    type: ChangeType.FieldDeprecationRemoved,
    meta: {
      fieldName: field.name,
      typeName: type.name,
    },
  });
}

function buildFieldDeprecationReasonChangedMessage(
  args: FieldDeprecationReasonChangedChange['meta'],
) {
  return `Deprecation reason on field '${args.typeName}.${args.fieldName}' has changed from '${args.oldDeprecationReason}' to '${args.newDeprecationReason}'`;
}

export function fieldDeprecationReasonChangedFromMeta(args: FieldDeprecationReasonChangedChange) {
  return {
    type: ChangeType.FieldDeprecationReasonChanged,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldDeprecationReasonChangedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName].join('.'),
  } as const;
}

export function fieldDeprecationReasonChanged(
  type: GraphQLObjectType | GraphQLInterfaceType,
  oldField: GraphQLField<any, any>,
  newField: GraphQLField<any, any>,
): Change<typeof ChangeType.FieldDeprecationReasonChanged> {
  return fieldDeprecationReasonChangedFromMeta({
    type: ChangeType.FieldDeprecationReasonChanged,
    meta: {
      fieldName: newField.name,
      typeName: type.name,
      newDeprecationReason: newField.deprecationReason ?? '',
      oldDeprecationReason: oldField.deprecationReason ?? '',
    },
  });
}

function buildFieldDeprecationReasonAddedMessage(args: FieldDeprecationReasonAddedChange['meta']) {
  return `Field '${args.typeName}.${args.fieldName}' has deprecation reason '${args.addedDeprecationReason}'`;
}

export function fieldDeprecationReasonAddedFromMeta(args: FieldDeprecationReasonAddedChange) {
  return {
    type: ChangeType.FieldDeprecationReasonAdded,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldDeprecationReasonAddedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName, `@${GraphQLDeprecatedDirective.name}`].join(
      '.',
    ),
  } as const;
}

export function fieldDeprecationReasonAdded(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any>,
): Change<typeof ChangeType.FieldDeprecationReasonAdded> {
  return fieldDeprecationReasonAddedFromMeta({
    type: ChangeType.FieldDeprecationReasonAdded,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      addedDeprecationReason: field.deprecationReason ?? '',
    },
  });
}

export function fieldDeprecationReasonRemovedFromMeta(args: FieldDeprecationReasonRemovedChange) {
  return {
    type: ChangeType.FieldDeprecationReasonRemoved,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: `Deprecation reason was removed from field '${args.meta.typeName}.${args.meta.fieldName}'`,
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName].join('.'),
  } as const;
}

export function fieldDeprecationReasonRemoved(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any>,
): Change<typeof ChangeType.FieldDeprecationReasonRemoved> {
  return fieldDeprecationReasonRemovedFromMeta({
    type: ChangeType.FieldDeprecationReasonRemoved,
    meta: {
      typeName: type.name,
      fieldName: field.name,
    },
  });
}

function buildFieldTypeChangedMessage(args: FieldTypeChangedChange) {
  return `Field '${args.meta.typeName}.${args.meta.fieldName}' changed type from '${args.meta.oldFieldType}' to '${args.meta.newFieldType}'`;
}

export function fieldTypeChangedFromMeta(args: FieldTypeChangedChange) {
  return {
    type: ChangeType.FieldTypeChanged,
    criticality: {
      level: args.meta.isSafeFieldTypeChange
        ? CriticalityLevel.NonBreaking
        : CriticalityLevel.Breaking,
    },
    message: buildFieldTypeChangedMessage(args),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName].join('.'),
  } as const;
}

export function fieldTypeChanged(
  type: GraphQLObjectType | GraphQLInterfaceType,
  oldField: GraphQLField<any, any, any>,
  newField: GraphQLField<any, any, any>,
): Change<typeof ChangeType.FieldTypeChanged> {
  return fieldTypeChangedFromMeta({
    type: ChangeType.FieldTypeChanged,
    meta: {
      typeName: type.name,
      fieldName: oldField.name,
      oldFieldType: oldField.type.toString(),
      newFieldType: newField.type.toString(),
      isSafeFieldTypeChange: safeChangeForField(oldField.type, newField.type),
    },
  });
}

function buildFieldArgumentAddedMessage(args: FieldArgumentAddedChange['meta']) {
  return `Argument '${args.addedArgumentName}: ${args.addedArgumentType}'${
    args.hasDefaultValue ? ' (with default value) ' : ' '
  }added to field '${args.typeName}.${args.fieldName}'`;
}

export function fieldArgumentAddedFromMeta(args: FieldArgumentAddedChange) {
  return {
    type: ChangeType.FieldArgumentAdded,
    criticality: {
      level: args.meta.addedToNewField
        ? CriticalityLevel.NonBreaking
        : args.meta.isAddedFieldArgumentBreaking
          ? CriticalityLevel.Breaking
          : CriticalityLevel.Dangerous,
    },
    message: buildFieldArgumentAddedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName, args.meta.addedArgumentName].join('.'),
  } as const;
}

export function fieldArgumentAdded(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  arg: GraphQLArgument,
  addedToNewField: boolean,
): Change<typeof ChangeType.FieldArgumentAdded> {
  const isBreaking = isNonNullType(arg.type) && typeof arg.defaultValue === 'undefined';

  return fieldArgumentAddedFromMeta({
    type: ChangeType.FieldArgumentAdded,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      addedArgumentName: arg.name,
      addedArgumentType: arg.type.toString(),
      hasDefaultValue: arg.defaultValue != null,
      addedToNewField,
      isAddedFieldArgumentBreaking: isBreaking,
    },
  });
}

function buildFieldArgumentRemovedMessage(args: FieldArgumentRemovedChange) {
  return `Argument '${args.meta.removedFieldArgumentName}: ${args.meta.removedFieldType}' was removed from field '${args.meta.typeName}.${args.meta.fieldName}'`;
}

export function fieldArgumentRemovedFromMeta(args: FieldArgumentRemovedChange) {
  return {
    type: ChangeType.FieldArgumentRemoved,
    criticality: {
      level: CriticalityLevel.Breaking,
    },
    message: buildFieldArgumentRemovedMessage(args),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName, args.meta.removedFieldArgumentName].join('.'),
  } as const;
}

export function fieldArgumentRemoved(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  arg: GraphQLArgument,
): Change<typeof ChangeType.FieldArgumentRemoved> {
  return fieldArgumentRemovedFromMeta({
    type: ChangeType.FieldArgumentRemoved,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      removedFieldArgumentName: arg.name,
      removedFieldType: arg.type.toString(),
    },
  });
}
