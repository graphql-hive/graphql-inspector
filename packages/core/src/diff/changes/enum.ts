import { GraphQLDeprecatedDirective, GraphQLEnumType, GraphQLEnumValue } from 'graphql';
import { isDeprecated } from '../../utils/is-deprecated.js';
import { fmt } from '../../utils/string.js';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  EnumValueAddedChange,
  EnumValueDeprecationReasonAddedChange,
  EnumValueDeprecationReasonChangedChange,
  EnumValueDeprecationReasonRemovedChange,
  EnumValueDescriptionChangedChange,
  EnumValueRemovedChange,
} from './change.js';

function buildEnumValueRemovedMessage(args: EnumValueRemovedChange['meta']) {
  return `Enum value '${args.removedEnumValueName}' ${
    args.isEnumValueDeprecated ? '(deprecated) ' : ''
  }was removed from enum '${args.enumName}'`;
}

const enumValueRemovedCriticalityBreakingReason = `Removing an enum value will cause existing queries that use this enum value to error.`;

export function enumValueRemovedFromMeta(args: EnumValueRemovedChange) {
  return {
    type: ChangeType.EnumValueRemoved,
    criticality: {
      level: CriticalityLevel.Breaking,
      reason: enumValueRemovedCriticalityBreakingReason,
    },
    message: buildEnumValueRemovedMessage(args.meta),
    meta: args.meta,
    path: [args.meta.enumName, args.meta.removedEnumValueName].join('.'),
  } as const;
}

export function enumValueRemoved(
  oldEnum: GraphQLEnumType,
  value: GraphQLEnumValue,
): Change<typeof ChangeType.EnumValueRemoved> {
  return enumValueRemovedFromMeta({
    type: ChangeType.EnumValueRemoved,
    meta: {
      enumName: oldEnum.name,
      removedEnumValueName: value.name,
      isEnumValueDeprecated: isDeprecated(value),
    },
  });
}

function buildEnumValueAddedMessage(args: EnumValueAddedChange) {
  return `Enum value '${args.meta.addedEnumValueName}' was added to enum '${args.meta.enumName}'`;
}

const enumValueAddedCriticalityDangerousReason = `Adding an enum value may break existing clients that were not programming defensively against an added case when querying an enum.`;

export function enumValueAddedFromMeta(args: EnumValueAddedChange) {
  /** Dangerous is there was a previous enum value */
  const isSafe = args.meta.addedToNewType;
  return {
    type: ChangeType.EnumValueAdded,
    criticality: {
      level: isSafe ? CriticalityLevel.NonBreaking : CriticalityLevel.Dangerous,
      reason: isSafe ? undefined : enumValueAddedCriticalityDangerousReason,
    },
    message: buildEnumValueAddedMessage(args),
    meta: args.meta,
    path: [args.meta.enumName, args.meta.addedEnumValueName].join('.'),
  } as const;
}

export function enumValueAdded(
  type: GraphQLEnumType,
  value: GraphQLEnumValue,
  addedToNewType: boolean,
): Change<typeof ChangeType.EnumValueAdded> {
  return enumValueAddedFromMeta({
    type: ChangeType.EnumValueAdded,
    meta: {
      enumName: type.name,
      addedEnumValueName: value.name,
      addedToNewType,
      addedDirectiveDescription: value.description ?? null,
    },
  });
}

function buildEnumValueDescriptionChangedMessage(args: EnumValueDescriptionChangedChange['meta']) {
  if (args.oldEnumValueDescription === null && args.newEnumValueDescription !== null) {
    return `Description '${fmt(args.newEnumValueDescription)}' was added to enum value '${args.enumName}.${args.enumValueName}'`;
  }
  if (args.newEnumValueDescription === null && args.oldEnumValueDescription !== null) {
    return `Description '${fmt(args.oldEnumValueDescription)}' was removed from enum value '${args.enumName}.${args.enumValueName}'`;
  }
  return `Description for enum value '${args.enumName}.${args.enumValueName}' changed from '${fmt(args.oldEnumValueDescription ?? '')}' to '${fmt(args.newEnumValueDescription ?? '')}'`;
}

export function enumValueDescriptionChangedFromMeta(
  args: EnumValueDescriptionChangedChange,
): Change<typeof ChangeType.EnumValueDescriptionChanged> {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.EnumValueDescriptionChanged,
    message: buildEnumValueDescriptionChangedMessage(args.meta),
    path: [args.meta.enumName, args.meta.enumValueName].join('.'),
    meta: args.meta,
  } as const;
}

export function enumValueDescriptionChanged(
  newEnum: GraphQLEnumType,
  oldValue: GraphQLEnumValue | null,
  newValue: GraphQLEnumValue,
): Change<typeof ChangeType.EnumValueDescriptionChanged> {
  return enumValueDescriptionChangedFromMeta({
    type: ChangeType.EnumValueDescriptionChanged,
    meta: {
      enumName: newEnum.name,
      enumValueName: newValue.name,
      oldEnumValueDescription: oldValue?.description ?? null,
      newEnumValueDescription: newValue.description ?? null,
    },
  });
}

function buildEnumValueDeprecationChangedMessage(
  args: EnumValueDeprecationReasonChangedChange['meta'],
) {
  const oldReason = fmt(args.oldEnumValueDeprecationReason);
  const newReason = fmt(args.newEnumValueDeprecationReason);
  return `Enum value '${args.enumName}.${args.enumValueName}' deprecation reason changed from '${oldReason}' to '${newReason}'`;
}

export function enumValueDeprecationReasonChangedFromMeta(
  args: EnumValueDeprecationReasonChangedChange,
) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.EnumValueDeprecationReasonChanged,
    message: buildEnumValueDeprecationChangedMessage(args.meta),
    path: [args.meta.enumName, args.meta.enumValueName, `@${GraphQLDeprecatedDirective.name}`].join(
      '.',
    ),
    meta: args.meta,
  } as const;
}

export function enumValueDeprecationReasonChanged(
  newEnum: GraphQLEnumType,
  oldValue: GraphQLEnumValue,
  newValue: GraphQLEnumValue,
): Change<typeof ChangeType.EnumValueDeprecationReasonChanged> {
  return enumValueDeprecationReasonChangedFromMeta({
    type: ChangeType.EnumValueDeprecationReasonChanged,
    meta: {
      enumName: newEnum.name,
      enumValueName: oldValue.name,
      oldEnumValueDeprecationReason: oldValue.deprecationReason ?? '',
      newEnumValueDeprecationReason: newValue.deprecationReason ?? '',
    },
  });
}

function buildEnumValueDeprecationReasonAddedMessage(
  args: EnumValueDeprecationReasonAddedChange['meta'],
) {
  const reason = fmt(args.addedValueDeprecationReason);
  return `Enum value '${args.enumName}.${args.enumValueName}' was deprecated with reason '${reason}'`;
}

export function enumValueDeprecationReasonAddedFromMeta(
  args: EnumValueDeprecationReasonAddedChange,
) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.EnumValueDeprecationReasonAdded,
    message: buildEnumValueDeprecationReasonAddedMessage(args.meta),
    path: [args.meta.enumName, args.meta.enumValueName, `@${GraphQLDeprecatedDirective.name}`].join(
      '.',
    ),
    meta: args.meta,
  } as const;
}

export function enumValueDeprecationReasonAdded(
  newEnum: GraphQLEnumType,
  _oldValue: GraphQLEnumValue | null,
  newValue: GraphQLEnumValue,
): Change<typeof ChangeType.EnumValueDeprecationReasonAdded> {
  return enumValueDeprecationReasonAddedFromMeta({
    type: ChangeType.EnumValueDeprecationReasonAdded,
    meta: {
      enumName: newEnum.name,
      enumValueName: newValue.name,
      addedValueDeprecationReason: newValue.deprecationReason ?? '',
    },
  });
}

function buildEnumValueDeprecationReasonRemovedMessage(
  args: EnumValueDeprecationReasonRemovedChange['meta'],
) {
  return `Deprecation reason was removed from enum value '${args.enumName}.${args.enumValueName}'`;
}

export function enumValueDeprecationReasonRemovedFromMeta(
  args: EnumValueDeprecationReasonRemovedChange,
) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.EnumValueDeprecationReasonRemoved,
    message: buildEnumValueDeprecationReasonRemovedMessage(args.meta),
    path: [args.meta.enumName, args.meta.enumValueName].join('.'),
    meta: args.meta,
  } as const;
}

export function enumValueDeprecationReasonRemoved(
  newEnum: GraphQLEnumType,
  oldValue: GraphQLEnumValue,
  _newValue: GraphQLEnumValue,
): Change<typeof ChangeType.EnumValueDeprecationReasonRemoved> {
  return enumValueDeprecationReasonRemovedFromMeta({
    type: ChangeType.EnumValueDeprecationReasonRemoved,
    meta: {
      enumName: newEnum.name,
      enumValueName: oldValue.name,
      removedEnumValueDeprecationReason: oldValue.deprecationReason ?? '',
    },
  });
}
