import {
  Change,
  ChangeType,
  CriticalityLevel,
  DirectiveUsageEnumValueChangedChange,
} from './change.js';
import { isOfKind, KindToPayload } from './directive-usage.js';
import { ConstArgumentNode } from 'graphql/language';
import { ConstDirectiveNode, Kind } from 'graphql';

function buildDirectiveUsageEnumValueChangedMessage(
  args: DirectiveUsageEnumValueChangedChange['meta'],
): string {
  // TODO: Change the message to include a more detailed reason, e.g. added argument, removed argument, changed argument value or type
  return `Directive '${args.directiveName}' usage was changed in enum value '${args.enumName}.${args.enumValueName}'`;
}

export function directiveUsageEnumValueChangedFromMeta(args: DirectiveUsageEnumValueChangedChange) {
  return {
    criticality: {
      level: CriticalityLevel.Breaking,
      reason: `Directive '${args.meta.directiveName}' was removed from enum value '${args.meta.enumName}.${args.meta.enumValueName}'`,
    },
    type: ChangeType.DirectiveUsageEnumValueRemoved,
    message: buildDirectiveUsageEnumValueChangedMessage(args.meta),
    path: [args.meta.enumName, args.meta.enumValueName, args.meta.directiveName].join('.'),
    meta: args.meta,
  } as const;
}

export function directiveUsageArgumentAdded<K extends keyof KindToPayload>(
  kind: K,
  payload: KindToPayload[K]['input'],
  directive: ConstDirectiveNode,
  argument: ConstArgumentNode
): Change {
  // TODO: create the function to return a Change object for argument added and invoke it from here
  return {} as any;
}

export function directiveUsageArgumentRemoved<K extends keyof KindToPayload>(
  kind: K,
  payload: KindToPayload[K]['input'],
  directive: ConstDirectiveNode,
  argument: ConstArgumentNode
): Change {
  // TODO: Same as above but for removed
  return {} as any;
}

export function directiveUsageArgumentChanged<K extends keyof KindToPayload>(
  kind: K, payload: KindToPayload[K]['input'], directive: ConstDirectiveNode, oldVersion: ConstArgumentNode, newVersion: ConstArgumentNode
): Change {
  if (isOfKind(kind, Kind.ENUM_VALUE_DEFINITION, payload)) {
    return directiveUsageEnumValueChangedFromMeta({
      type: ChangeType.DirectiveUsageEnumValueChanged,
      meta: {
        enumName: payload.type.name,
        enumValueName: payload.value.name,
        directiveName: directive.name.value,
        argumentName: oldVersion.name.value,
        // TODO: Consider the types like null, list, and object
        oldArgumentValue: 'value' in oldVersion.value ? String(oldVersion.value.value) : '',
        newArgumentValue: 'value' in newVersion.value ? String(newVersion.value.value) : ''
      },
    })
  }
  return {} as any;
}
