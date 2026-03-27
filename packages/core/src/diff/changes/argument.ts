import {
  GraphQLArgument,
  GraphQLDeprecatedDirective,
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';
import { safeChangeForInputValue } from '../../utils/graphql.js';
import { fmt, safeString } from '../../utils/string.js';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  FieldArgumentDefaultChangedChange,
  FieldArgumentDeprecationAddedChange,
  FieldArgumentDeprecationReasonAddedChange,
  FieldArgumentDeprecationReasonChangedChange,
  FieldArgumentDeprecationReasonRemovedChange,
  FieldArgumentDeprecationRemovedChange,
  FieldArgumentDescriptionChangedChange,
  FieldArgumentTypeChangedChange,
} from './change.js';

function buildFieldArgumentDescriptionChangedMessage(
  args: FieldArgumentDescriptionChangedChange['meta'],
): string {
  if (args.oldDescription === null && args.newDescription !== null) {
    return `Description '${fmt(args.newDescription)}' was added to argument '${args.argumentName}' on field '${args.typeName}.${args.fieldName}'`;
  }
  if (args.newDescription === null && args.oldDescription !== null) {
    return `Description '${fmt(args.oldDescription)}' was removed from argument '${args.argumentName}' on field '${args.typeName}.${args.fieldName}'`;
  }
  return `Description for argument '${args.argumentName}' on field '${args.typeName}.${args.fieldName}' changed from '${fmt(args.oldDescription ?? '')}' to '${fmt(args.newDescription ?? '')}'`;
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

function fieldArgumentDeprecationPath(meta: {
  typeName: string;
  fieldName: string;
  argumentName: string;
}) {
  return [meta.typeName, meta.fieldName, meta.argumentName, `@${GraphQLDeprecatedDirective.name}`].join(
    '.',
  );
}

function buildFieldArgumentDeprecatedAddedMessage(args: FieldArgumentDeprecationAddedChange['meta']) {
  return `Argument '${args.argumentName}' on field '${args.typeName}.${args.fieldName}' is deprecated`;
}

export function fieldArgumentDeprecationAddedFromMeta(args: FieldArgumentDeprecationAddedChange) {
  return {
    type: ChangeType.FieldArgumentDeprecationAdded,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldArgumentDeprecatedAddedMessage(args.meta),
    meta: args.meta,
    path: fieldArgumentDeprecationPath(args.meta),
  } as const;
}

export function fieldArgumentDeprecationAdded(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  arg: GraphQLArgument,
): Change<typeof ChangeType.FieldArgumentDeprecationAdded> {
  return fieldArgumentDeprecationAddedFromMeta({
    type: ChangeType.FieldArgumentDeprecationAdded,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      argumentName: arg.name,
      deprecationReason: arg.deprecationReason ?? '',
    },
  });
}

export function fieldArgumentDeprecationRemovedFromMeta(args: FieldArgumentDeprecationRemovedChange) {
  return {
    type: ChangeType.FieldArgumentDeprecationRemoved,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: `Argument '${args.meta.argumentName}' on field '${args.meta.typeName}.${args.meta.fieldName}' is no longer deprecated`,
    meta: args.meta,
    path: fieldArgumentDeprecationPath(args.meta),
  } as const;
}

export function fieldArgumentDeprecationRemoved(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  arg: GraphQLArgument,
): Change<typeof ChangeType.FieldArgumentDeprecationRemoved> {
  return fieldArgumentDeprecationRemovedFromMeta({
    type: ChangeType.FieldArgumentDeprecationRemoved,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      argumentName: arg.name,
    },
  });
}

function buildFieldArgumentDeprecationReasonChangedMessage(
  args: FieldArgumentDeprecationReasonChangedChange['meta'],
) {
  const oldReason = fmt(args.oldDeprecationReason);
  const newReason = fmt(args.newDeprecationReason);
  return `Deprecation reason on argument '${args.argumentName}' on field '${args.typeName}.${args.fieldName}' has changed from '${oldReason}' to '${newReason}'`;
}

export function fieldArgumentDeprecationReasonChangedFromMeta(
  args: FieldArgumentDeprecationReasonChangedChange,
) {
  return {
    type: ChangeType.FieldArgumentDeprecationReasonChanged,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldArgumentDeprecationReasonChangedMessage(args.meta),
    meta: args.meta,
    path: fieldArgumentDeprecationPath(args.meta),
  } as const;
}

export function fieldArgumentDeprecationReasonChanged(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  oldArg: GraphQLArgument,
  newArg: GraphQLArgument,
): Change<typeof ChangeType.FieldArgumentDeprecationReasonChanged> {
  return fieldArgumentDeprecationReasonChangedFromMeta({
    type: ChangeType.FieldArgumentDeprecationReasonChanged,
    meta: {
      argumentName: newArg.name,
      fieldName: field.name,
      typeName: type.name,
      newDeprecationReason: newArg.deprecationReason ?? '',
      oldDeprecationReason: oldArg.deprecationReason ?? '',
    },
  });
}

function buildFieldArgumentDeprecationReasonAddedMessage(
  args: FieldArgumentDeprecationReasonAddedChange['meta'],
) {
  const reason = fmt(args.addedDeprecationReason);
  return `Argument '${args.argumentName}' on field '${args.typeName}.${args.fieldName}' has deprecation reason '${reason}'`;
}

export function fieldArgumentDeprecationReasonAddedFromMeta(
  args: FieldArgumentDeprecationReasonAddedChange,
) {
  return {
    type: ChangeType.FieldArgumentDeprecationReasonAdded,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: buildFieldArgumentDeprecationReasonAddedMessage(args.meta),
    meta: args.meta,
    path: fieldArgumentDeprecationPath(args.meta),
  } as const;
}

export function fieldArgumentDeprecationReasonAdded(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  arg: GraphQLArgument,
): Change<typeof ChangeType.FieldArgumentDeprecationReasonAdded> {
  return fieldArgumentDeprecationReasonAddedFromMeta({
    type: ChangeType.FieldArgumentDeprecationReasonAdded,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      argumentName: arg.name,
      addedDeprecationReason: arg.deprecationReason ?? '',
    },
  });
}

export function fieldArgumentDeprecationReasonRemovedFromMeta(
  args: FieldArgumentDeprecationReasonRemovedChange,
) {
  return {
    type: ChangeType.FieldArgumentDeprecationReasonRemoved,
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    message: `Deprecation reason was removed from argument '${args.meta.argumentName}' on field '${args.meta.typeName}.${args.meta.fieldName}'`,
    meta: args.meta,
    path: [args.meta.typeName, args.meta.fieldName, args.meta.argumentName].join('.'),
  } as const;
}

export function fieldArgumentDeprecationReasonRemoved(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  arg: GraphQLArgument,
): Change<typeof ChangeType.FieldArgumentDeprecationReasonRemoved> {
  return fieldArgumentDeprecationReasonRemovedFromMeta({
    type: ChangeType.FieldArgumentDeprecationReasonRemoved,
    meta: {
      typeName: type.name,
      fieldName: field.name,
      argumentName: arg.name,
    },
  });
}
