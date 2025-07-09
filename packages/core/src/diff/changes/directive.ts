import { DirectiveLocationEnum, GraphQLArgument, GraphQLDirective, isNonNullType } from 'graphql';
import { safeChangeForInputValue } from '../../utils/graphql.js';
import { safeString } from '../../utils/string.js';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  DirectiveAddedChange,
  DirectiveArgumentAddedChange,
  DirectiveArgumentDefaultValueChangedChange,
  DirectiveArgumentDescriptionChangedChange,
  DirectiveArgumentRemovedChange,
  DirectiveArgumentTypeChangedChange,
  DirectiveDescriptionChangedChange,
  DirectiveLocationAddedChange,
  DirectiveLocationRemovedChange,
  DirectiveRemovedChange,
} from './change.js';

function buildDirectiveRemovedMessage(args: DirectiveRemovedChange['meta']): string {
  return `Directive '${args.removedDirectiveName}' was removed`;
}

const directiveRemovedCriticalityBreakingReason = `A directive could be in use of a client application. Removing it could break the client application.`;

export function directiveRemovedFromMeta(args: DirectiveRemovedChange) {
  return {
    criticality: {
      level: CriticalityLevel.Breaking,
      reason: directiveRemovedCriticalityBreakingReason,
    },
    type: ChangeType.DirectiveRemoved,
    message: buildDirectiveRemovedMessage(args.meta),
    path: `@${args.meta.removedDirectiveName}`,
    meta: args.meta,
  } as const;
}

export function directiveRemoved(
  directive: GraphQLDirective,
): Change<typeof ChangeType.DirectiveRemoved> {
  return directiveRemovedFromMeta({
    type: ChangeType.DirectiveRemoved,
    meta: {
      removedDirectiveName: directive.name,
    },
  });
}

function buildDirectiveAddedMessage(args: DirectiveAddedChange['meta']): string {
  return `Directive '${args.addedDirectiveName}' was added`;
}

export function directiveAddedFromMeta(args: DirectiveAddedChange) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.DirectiveAdded,
    message: buildDirectiveAddedMessage(args.meta),
    path: `@${args.meta.addedDirectiveName}`,
    meta: args.meta,
  } as const;
}

export function directiveAdded(
  directive: GraphQLDirective,
): Change<typeof ChangeType.DirectiveAdded> {
  return directiveAddedFromMeta({
    type: ChangeType.DirectiveAdded,
    meta: {
      addedDirectiveName: directive.name,
    },
  });
}

function buildDirectiveDescriptionChangedMessage(
  args: DirectiveDescriptionChangedChange['meta'],
): string {
  return `Directive '${args.directiveName}' description changed from '${
    args.oldDirectiveDescription ?? 'undefined'
  }' to '${args.newDirectiveDescription ?? 'undefined'}'`;
}

export function directiveDescriptionChangedFromMeta(args: DirectiveDescriptionChangedChange) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.DirectiveDescriptionChanged,
    message: buildDirectiveDescriptionChangedMessage(args.meta),
    path: `@${args.meta.directiveName}`,
    meta: args.meta,
  } as const;
}

export function directiveDescriptionChanged(
  oldDirective: GraphQLDirective | null,
  newDirective: GraphQLDirective,
): Change<typeof ChangeType.DirectiveDescriptionChanged> {
  return directiveDescriptionChangedFromMeta({
    type: ChangeType.DirectiveDescriptionChanged,
    meta: {
      directiveName: newDirective.name,
      oldDirectiveDescription: oldDirective?.description ?? null,
      newDirectiveDescription: newDirective.description ?? null,
    },
  });
}

function buildDirectiveLocationAddedMessage(args: DirectiveLocationAddedChange['meta']): string {
  return `Location '${args.addedDirectiveLocation}' was added to directive '${args.directiveName}'`;
}

export function directiveLocationAddedFromMeta(args: DirectiveLocationAddedChange) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.DirectiveLocationAdded,
    message: buildDirectiveLocationAddedMessage(args.meta),
    path: `@${args.meta.directiveName}`,
    meta: args.meta,
  } as const;
}

export function directiveLocationAdded(
  directive: GraphQLDirective,
  location: DirectiveLocationEnum,
): Change<typeof ChangeType.DirectiveLocationAdded> {
  return directiveLocationAddedFromMeta({
    type: ChangeType.DirectiveLocationAdded,
    meta: {
      directiveName: directive.name,
      addedDirectiveLocation: location.toString(),
    },
  });
}

function buildDirectiveLocationRemovedMessage(
  args: DirectiveLocationRemovedChange['meta'],
): string {
  return `Location '${args.removedDirectiveLocation}' was removed from directive '${args.directiveName}'`;
}

const directiveLocationRemovedBreakingReason = `A directive could be in use of a client application. Removing it could break the client application.`;

export function directiveLocationRemovedFromMeta(args: DirectiveLocationRemovedChange) {
  return {
    criticality: {
      level: CriticalityLevel.Breaking,
      reason: directiveLocationRemovedBreakingReason,
    },
    type: ChangeType.DirectiveLocationRemoved,
    message: buildDirectiveLocationRemovedMessage(args.meta),
    path: `@${args.meta.directiveName}`,
    meta: args.meta,
  } as const;
}

export function directiveLocationRemoved(
  directive: GraphQLDirective,
  location: DirectiveLocationEnum,
): Change<typeof ChangeType.DirectiveLocationRemoved> {
  return directiveLocationRemovedFromMeta({
    type: ChangeType.DirectiveLocationRemoved,
    meta: {
      directiveName: directive.name,
      removedDirectiveLocation: location.toString(),
    },
  });
}

const directiveArgumentAddedBreakingReason = `A directive could be in use of a client application. Adding a non-nullable argument will break those clients.`;
const directiveArgumentNonBreakingReason = `A directive could be in use of a client application. Adding a nullable argument will not break those clients.`;
const directiveArgumentNewReason = `Refer to the directive usage for the breaking status. If the directive is new and therefore unused, then adding an argument does not risk breaking clients.`;

export function directiveArgumentAddedFromMeta(args: DirectiveArgumentAddedChange) {
  return {
    criticality: args.meta.addedToNewDirective
      ? {
          level: CriticalityLevel.NonBreaking,
          reason: directiveArgumentNewReason,
        }
      : args.meta.addedDirectiveArgumentTypeIsNonNull
        ? {
            level: CriticalityLevel.Breaking,
            reason: directiveArgumentAddedBreakingReason,
          }
        : {
            level: CriticalityLevel.NonBreaking,
            reason: directiveArgumentNonBreakingReason,
          },
    type: ChangeType.DirectiveArgumentAdded,
    message: `Argument '${args.meta.addedDirectiveArgumentName}' was added to directive '${args.meta.directiveName}'`,
    path: `@${args.meta.directiveName}`,
    meta: args.meta,
  } as const;
}

export function directiveArgumentAdded(
  directive: GraphQLDirective,
  arg: GraphQLArgument,
  addedToNewDirective: boolean,
): Change<typeof ChangeType.DirectiveArgumentAdded> {
  return directiveArgumentAddedFromMeta({
    type: ChangeType.DirectiveArgumentAdded,
    meta: {
      directiveName: directive.name,
      addedDirectiveArgumentName: arg.name,
      addedDirectiveArgumentType: arg.type.toString(),
      addedDirectiveDefaultValue: safeString(arg.defaultValue),
      addedDirectiveArgumentTypeIsNonNull: isNonNullType(arg.type),
      addedDirectiveArgumentDescription: arg.description ?? null,
      addedToNewDirective,
    },
  });
}

function buildDirectiveArgumentRemovedMessage(
  args: DirectiveArgumentRemovedChange['meta'],
): string {
  return `Argument '${args.removedDirectiveArgumentName}' was removed from directive '${args.directiveName}'`;
}

const directiveArgumentRemovedBreakingReason = `A directive argument could be in use of a client application. Removing the argument can break client applications.`;

export function directiveArgumentRemovedFromMeta(args: DirectiveArgumentRemovedChange) {
  return {
    criticality: {
      level: CriticalityLevel.Breaking,
      reason: directiveArgumentRemovedBreakingReason,
    },
    type: ChangeType.DirectiveArgumentRemoved,
    message: buildDirectiveArgumentRemovedMessage(args.meta),
    path: `@${args.meta.directiveName}.${args.meta.removedDirectiveArgumentName}`,
    meta: args.meta,
  } as const;
}

export function directiveArgumentRemoved(
  directive: GraphQLDirective,
  arg: GraphQLArgument,
): Change<typeof ChangeType.DirectiveArgumentRemoved> {
  return directiveArgumentRemovedFromMeta({
    type: ChangeType.DirectiveArgumentRemoved,
    meta: {
      directiveName: directive.name,
      removedDirectiveArgumentName: arg.name,
    },
  });
}

function buildDirectiveArgumentDescriptionChangedMessage(
  args: DirectiveArgumentDescriptionChangedChange['meta'],
): string {
  return `Description for argument '${args.directiveArgumentName}' on directive '${args.directiveName}' changed from '${args.oldDirectiveArgumentDescription}' to '${args.newDirectiveArgumentDescription}'`;
}

export function directiveArgumentDescriptionChangedFromMeta(
  args: DirectiveArgumentDescriptionChangedChange,
) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.DirectiveArgumentDescriptionChanged,
    message: buildDirectiveArgumentDescriptionChangedMessage(args.meta),
    path: `@${args.meta.directiveName}.${args.meta.directiveArgumentName}`,
    meta: args.meta,
  } as const;
}

export function directiveArgumentDescriptionChanged(
  directive: GraphQLDirective,
  oldArg: GraphQLArgument | null,
  newArg: GraphQLArgument,
): Change<typeof ChangeType.DirectiveArgumentDescriptionChanged> {
  return directiveArgumentDescriptionChangedFromMeta({
    type: ChangeType.DirectiveArgumentDescriptionChanged,
    meta: {
      directiveName: directive.name,
      directiveArgumentName: newArg.name,
      oldDirectiveArgumentDescription: oldArg?.description ?? null,
      newDirectiveArgumentDescription: newArg.description ?? null,
    },
  });
}

function buildDirectiveArgumentDefaultValueChanged(
  args: DirectiveArgumentDefaultValueChangedChange['meta'],
): string {
  return args.oldDirectiveArgumentDefaultValue === undefined
    ? `Default value '${args.newDirectiveArgumentDefaultValue}' was added to argument '${args.directiveArgumentName}' on directive '${args.directiveName}'`
    : `Default value for argument '${args.directiveArgumentName}' on directive '${args.directiveName}' changed from '${args.oldDirectiveArgumentDefaultValue}' to '${args.newDirectiveArgumentDefaultValue}'`;
}

const directiveArgumentDefaultValueChangedDangerousReason =
  'Changing the default value for an argument may change the runtime behaviour of a field if it was never provided.';

export function directiveArgumentDefaultValueChangedFromMeta(
  args: DirectiveArgumentDefaultValueChangedChange,
) {
  return {
    criticality: {
      level: CriticalityLevel.Dangerous,
      reason: directiveArgumentDefaultValueChangedDangerousReason,
    },
    type: ChangeType.DirectiveArgumentDefaultValueChanged,
    message: buildDirectiveArgumentDefaultValueChanged(args.meta),
    path: `@${args.meta.directiveName}.${args.meta.directiveArgumentName}`,
    meta: args.meta,
  } as const;
}

export function directiveArgumentDefaultValueChanged(
  directive: GraphQLDirective,
  oldArg: GraphQLArgument | null,
  newArg: GraphQLArgument,
): Change<typeof ChangeType.DirectiveArgumentDefaultValueChanged> {
  const meta: DirectiveArgumentDefaultValueChangedChange['meta'] = {
    directiveName: directive.name,
    directiveArgumentName: newArg.name,
  };
  if (oldArg?.defaultValue !== undefined) {
    meta.oldDirectiveArgumentDefaultValue = safeString(oldArg.defaultValue);
  }
  if (newArg.defaultValue !== undefined) {
    meta.newDirectiveArgumentDefaultValue = safeString(newArg.defaultValue);
  }

  return directiveArgumentDefaultValueChangedFromMeta({
    type: ChangeType.DirectiveArgumentDefaultValueChanged,
    meta,
  });
}

function buildDirectiveArgumentTypeChangedMessage(
  args: DirectiveArgumentTypeChangedChange,
): string {
  return `Type for argument '${args.meta.directiveArgumentName}' on directive '${args.meta.directiveName}' changed from '${args.meta.oldDirectiveArgumentType}' to '${args.meta.newDirectiveArgumentType}'`;
}

const directiveArgumentTypeChangedNonBreakingReason =
  'Changing an input field from non-null to null is considered non-breaking.';

export function directiveArgumentTypeChangedFromMeta(args: DirectiveArgumentTypeChangedChange) {
  return {
    criticality: args.meta.isSafeDirectiveArgumentTypeChange
      ? {
          level: CriticalityLevel.NonBreaking,
          reason: directiveArgumentTypeChangedNonBreakingReason,
        }
      : {
          level: CriticalityLevel.Breaking,
        },
    type: ChangeType.DirectiveArgumentTypeChanged,
    message: buildDirectiveArgumentTypeChangedMessage(args),
    path: `@${args.meta.directiveName}.${args.meta.directiveArgumentName}`,
    meta: args.meta,
  } as const;
}

export function directiveArgumentTypeChanged(
  directive: GraphQLDirective,
  oldArg: GraphQLArgument,
  newArg: GraphQLArgument,
): Change<typeof ChangeType.DirectiveArgumentTypeChanged> {
  return directiveArgumentTypeChangedFromMeta({
    type: ChangeType.DirectiveArgumentTypeChanged,
    meta: {
      directiveName: directive.name,
      directiveArgumentName: newArg.name,
      oldDirectiveArgumentType: oldArg?.type.toString() ?? '',
      newDirectiveArgumentType: newArg.type.toString(),
      isSafeDirectiveArgumentTypeChange: safeChangeForInputValue(oldArg.type, newArg.type),
    },
  });
}
