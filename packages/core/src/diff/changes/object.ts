import { GraphQLInterfaceType, GraphQLObjectType } from 'graphql';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  ObjectTypeInterfaceAddedChange,
  ObjectTypeInterfaceRemovedChange,
} from './change.js';

function buildObjectTypeInterfaceAddedMessage(args: ObjectTypeInterfaceAddedChange['meta']) {
  return `'${args.objectTypeName}' object implements '${args.addedInterfaceName}' interface`;
}

export function objectTypeInterfaceAddedFromMeta(args: ObjectTypeInterfaceAddedChange) {
  return {
    type: ChangeType.ObjectTypeInterfaceAdded,
    criticality: {
      level: args.meta.addedToNewType ? CriticalityLevel.NonBreaking : CriticalityLevel.Dangerous,
      reason:
        'Adding an interface to an object type may break existing clients that were not programming defensively against a new possible type.',
    },
    message: buildObjectTypeInterfaceAddedMessage(args.meta),
    meta: args.meta,
    path: args.meta.objectTypeName,
  } as const;
}

export function objectTypeInterfaceAdded(
  iface: GraphQLInterfaceType,
  type: GraphQLObjectType | GraphQLInterfaceType,
  addedToNewType: boolean,
): Change<typeof ChangeType.ObjectTypeInterfaceAdded> {
  return objectTypeInterfaceAddedFromMeta({
    type: ChangeType.ObjectTypeInterfaceAdded,
    meta: {
      objectTypeName: type.name,
      addedInterfaceName: iface.name,
      addedToNewType,
    },
  });
}

function buildObjectTypeInterfaceRemovedMessage(args: ObjectTypeInterfaceRemovedChange['meta']) {
  return `'${args.objectTypeName}' object type no longer implements '${args.removedInterfaceName}' interface`;
}

export function objectTypeInterfaceRemovedFromMeta(args: ObjectTypeInterfaceRemovedChange) {
  return {
    type: ChangeType.ObjectTypeInterfaceRemoved,
    criticality: {
      level: CriticalityLevel.Breaking,
      reason:
        'Removing an interface from an object type can cause existing queries that use this in a fragment spread to error.',
    },
    message: buildObjectTypeInterfaceRemovedMessage(args.meta),
    meta: args.meta,
    path: args.meta.objectTypeName,
  } as const;
}

export function objectTypeInterfaceRemoved(
  iface: GraphQLInterfaceType,
  type: GraphQLObjectType | GraphQLInterfaceType,
): Change<typeof ChangeType.ObjectTypeInterfaceRemoved> {
  return objectTypeInterfaceRemovedFromMeta({
    type: ChangeType.ObjectTypeInterfaceRemoved,
    meta: {
      objectTypeName: type.name,
      removedInterfaceName: iface.name,
    },
  });
}
