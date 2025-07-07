import { GraphQLArgument, GraphQLField, GraphQLInterfaceType, GraphQLObjectType } from 'graphql';
import { safeChangeForInputValue } from '../../utils/graphql.js';
import { safeString } from '../../utils/string.js';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  FieldArgumentDefaultChangedChange,
  FieldArgumentDescriptionChangedChange,
  FieldArgumentTypeChangedChange,
} from './change.js';

function buildFieldArgumentDescriptionChangedMessage(
  args: FieldArgumentDescriptionChangedChange['meta'],
): string {
  return `Description for argument '${args.argumentName}' on field '${args.typeName}.${args.fieldName}' changed from '${args.oldDescription}' to '${args.newDescription}'`;
}

export function fieldArgumentDescriptionChangedFromMeta(
  args: FieldArgumentDescriptionChangedChange,
) {
  return {
    type: ChangeType.FieldArgumentDescriptionChanged,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldArgumentDescriptionChangedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName, args.meta.argumentName].join('.'),
  } as const;
}

export function fieldArgumentDescriptionChanged(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  oldArg: GraphQLArgument | null,
  newArg: GraphQLArgument,
): Change<typeof ChangeType.FieldArgumentDescriptionChanged> {
  return fieldArgumentDescriptionChangedFromMeta({
    type: ChangeType.FieldArgumentDescriptionChanged,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      argumentName: newArg.name,
      oldDescription: oldArg?.description ?? null,
      newDescription: newArg.description ?? null,
    },
  });
}

function buildFieldArgumentDefaultChangedMessage(
  args: FieldArgumentDefaultChangedChange['meta'],
): string {
  return args.oldDefaultValue === undefined
    ? `Default value '${args.newDefaultValue}' was added to argument '${args.argumentName}' on field '${args.typeName}.${args.fieldName}'`
    : `Default value for argument '${args.argumentName}' on field '${args.typeName}.${args.fieldName}' changed from '${args.oldDefaultValue}' to '${args.newDefaultValue}'`;
}

const fieldArgumentDefaultChangedCriticalityDangerousReason =
  'Changing the default value for an argument may change the runtime behaviour of a field if it was never provided.';

export function fieldArgumentDefaultChangedFromMeta(args: FieldArgumentDefaultChangedChange) {
  return {
    type: ChangeType.FieldArgumentDefaultChanged,
    criticality: {
      level: CriticalityLevel.Dangerous,
      reason: fieldArgumentDefaultChangedCriticalityDangerousReason,
    },
    message: buildFieldArgumentDefaultChangedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName, args.meta.argumentName].join('.'),
  } as const;
}

export function fieldArgumentDefaultChanged(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  oldArg: GraphQLArgument | null,
  newArg: GraphQLArgument,
): Change<typeof ChangeType.FieldArgumentDefaultChanged> {
  const meta: FieldArgumentDefaultChangedChange['meta'] = {
    typeName: type.name,
    fieldName: field.name,
    argumentName: newArg.name,
  };

  if (oldArg?.defaultValue !== undefined) {
    meta.oldDefaultValue = safeString(oldArg.defaultValue);
  }
  if (newArg.defaultValue !== undefined) {
    meta.newDefaultValue = safeString(newArg.defaultValue);
  }

  return fieldArgumentDefaultChangedFromMeta({
    type: ChangeType.FieldArgumentDefaultChanged,
    meta,
  });
}

function buildFieldArgumentTypeChangedMessage(
  args: FieldArgumentTypeChangedChange['meta'],
): string {
  return `Type for argument '${args.argumentName}' on field '${args.typeName}.${args.fieldName}' changed from '${args.oldArgumentType}' to '${args.newArgumentType}'`;
}

const fieldArgumentTypeChangedCriticalityNonBreakingReason = `Changing an input field from non-null to null is considered non-breaking.`;
const fieldArgumentTypeChangedCriticalityBreakingReason = `Changing the type of a field's argument can cause existing queries that use this argument to error.`;

export function fieldArgumentTypeChangedFromMeta(args: FieldArgumentTypeChangedChange) {
  return {
    type: ChangeType.FieldArgumentTypeChanged,
    criticality: args.meta.isSafeArgumentTypeChange
      ? {
          level: CriticalityLevel.NonBreaking,
          reason: fieldArgumentTypeChangedCriticalityNonBreakingReason,
        }
      : {
          level: CriticalityLevel.Breaking,
          reason: fieldArgumentTypeChangedCriticalityBreakingReason,
        },
    message: buildFieldArgumentTypeChangedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName, args.meta.argumentName].join('.'),
  } as const;
}

export function fieldArgumentTypeChanged(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  oldArg: GraphQLArgument | null,
  newArg: GraphQLArgument,
): Change<typeof ChangeType.FieldArgumentTypeChanged> {
  return fieldArgumentTypeChangedFromMeta({
    type: ChangeType.FieldArgumentTypeChanged,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      argumentName: newArg.name,
      oldArgumentType: oldArg?.type.toString() ?? '',
      newArgumentType: newArg.type.toString(),
      isSafeArgumentTypeChange: !oldArg || safeChangeForInputValue(oldArg.type, newArg.type),
    },
  });
}
