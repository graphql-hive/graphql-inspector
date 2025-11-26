import {
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isUnionType,
  Kind,
  type GraphQLNamedType,
} from 'graphql';
import { getKind } from '../../utils/graphql.js';
import { fmt } from '../../utils/string.js';
import {
  Change,
  ChangeType,
  CriticalityLevel,
  TypeAddedChange,
  TypeDescriptionAddedChange,
  TypeDescriptionChangedChange,
  TypeDescriptionRemovedChange,
  TypeKindChangedChange,
  TypeRemovedChange,
} from './change.js';

function buildTypeRemovedMessage(type: TypeRemovedChange['meta']): string {
  return `Type '${type.removedTypeName}' was removed`;
}

export function typeRemovedFromMeta(args: TypeRemovedChange) {
  return {
    criticality: {
      level: CriticalityLevel.Breaking,
    },
    type: ChangeType.TypeRemoved,
    message: buildTypeRemovedMessage(args.meta),
    meta: args.meta,
    path: args.meta.removedTypeName,
  } as const;
}

export function typeRemoved(type: GraphQLNamedType): Change<typeof ChangeType.TypeRemoved> {
  return typeRemovedFromMeta({
    type: ChangeType.TypeRemoved,
    meta: {
      removedTypeName: type.name,
    },
  });
}

function buildTypeAddedMessage(type: TypeAddedChange['meta']): string {
  return `Type '${type.addedTypeName}' was added`;
}

export function typeAddedFromMeta(args: TypeAddedChange) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.TypeAdded,
    message: buildTypeAddedMessage(args.meta),
    meta: args.meta,
    path: args.meta.addedTypeName,
  } as const;
}

function addedTypeMeta(type: GraphQLNamedType): TypeAddedChange['meta'] {
  if (isEnumType(type)) {
    return {
      addedTypeKind: Kind.ENUM_TYPE_DEFINITION,
      addedTypeName: type.name,
    };
  }
  if (isObjectType(type) || isInterfaceType(type)) {
    return {
      addedTypeKind: getKind(type) as any as
        | Kind.INTERFACE_TYPE_DEFINITION
        | Kind.OBJECT_TYPE_DEFINITION,
      addedTypeName: type.name,
    };
  }
  if (isUnionType(type)) {
    return {
      addedTypeKind: Kind.UNION_TYPE_DEFINITION,
      addedTypeName: type.name,
    };
  }
  if (isInputObjectType(type)) {
    return {
      addedTypeKind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      addedTypeIsOneOf: type.isOneOf,
      addedTypeName: type.name,
    };
  }
  return {
    addedTypeKind: getKind(type) as any as Kind.SCALAR_TYPE_DEFINITION,
    addedTypeName: type.name,
  };
}

export function typeAdded(type: GraphQLNamedType): Change<typeof ChangeType.TypeAdded> {
  return typeAddedFromMeta({
    type: ChangeType.TypeAdded,
    meta: addedTypeMeta(type),
  });
}

function buildTypeKindChangedMessage(args: TypeKindChangedChange): string {
  return `'${args.meta.typeName}' kind changed from '${args.meta.oldTypeKind}' to '${args.meta.newTypeKind}'`;
}

export function typeKindChangedFromMeta(args: TypeKindChangedChange) {
  return {
    criticality: {
      level: CriticalityLevel.Breaking,
      reason: `Changing the kind of a type is a breaking change because it can cause existing queries to error. For example, turning an object type to a scalar type would break queries that define a selection set for this type.`,
    },
    type: ChangeType.TypeKindChanged,
    message: buildTypeKindChangedMessage(args),
    path: args.meta.typeName,
    meta: args.meta,
  } as const;
}

export function typeKindChanged(
  oldType: GraphQLNamedType,
  newType: GraphQLNamedType,
): Change<typeof ChangeType.TypeKindChanged> {
  return typeKindChangedFromMeta({
    type: ChangeType.TypeKindChanged,
    meta: {
      typeName: newType.name,
      newTypeKind: String(getKind(newType)),
      oldTypeKind: String(getKind(oldType)),
    },
  });
}

function buildTypeDescriptionChangedMessage(args: TypeDescriptionChangedChange['meta']): string {
  const oldDesc = fmt(args.oldTypeDescription);
  const newDesc = fmt(args.newTypeDescription);
  return `Description '${oldDesc}' on type '${args.typeName}' has changed to '${newDesc}'`;
}

export function typeDescriptionChangedFromMeta(args: TypeDescriptionChangedChange) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.TypeDescriptionChanged,
    message: buildTypeDescriptionChangedMessage(args.meta),
    path: args.meta.typeName,
    meta: args.meta,
  } as const;
}

export function typeDescriptionChanged(
  oldType: GraphQLNamedType,
  newType: GraphQLNamedType,
): Change<typeof ChangeType.TypeDescriptionChanged> {
  return typeDescriptionChangedFromMeta({
    type: ChangeType.TypeDescriptionChanged,
    meta: {
      typeName: oldType.name,
      newTypeDescription: newType.description ?? '',
      oldTypeDescription: oldType.description ?? '',
    },
  });
}

function buildTypeDescriptionRemoved(args: TypeDescriptionRemovedChange['meta']): string {
  const desc = fmt(args.removedTypeDescription);
  return `Description '${desc}' was removed from object type '${args.typeName}'`;
}

export function typeDescriptionRemovedFromMeta(args: TypeDescriptionRemovedChange) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.TypeDescriptionRemoved,
    message: buildTypeDescriptionRemoved(args.meta),
    path: args.meta.typeName,
    meta: args.meta,
  } as const;
}

export function typeDescriptionRemoved(
  type: GraphQLNamedType,
): Change<typeof ChangeType.TypeDescriptionRemoved> {
  return typeDescriptionRemovedFromMeta({
    type: ChangeType.TypeDescriptionRemoved,
    meta: {
      typeName: type.name,
      removedTypeDescription: type.description ?? '',
    },
  });
}

function buildTypeDescriptionAddedMessage(args: TypeDescriptionAddedChange['meta']): string {
  const desc = fmt(args.addedTypeDescription);
  return `Object type '${args.typeName}' has description '${desc}'`;
}

export function typeDescriptionAddedFromMeta(args: TypeDescriptionAddedChange) {
  return {
    criticality: {
      level: CriticalityLevel.NonBreaking,
    },
    type: ChangeType.TypeDescriptionAdded,
    message: buildTypeDescriptionAddedMessage(args.meta),
    path: args.meta.typeName,
    meta: args.meta,
  } as const;
}

export function typeDescriptionAdded(
  type: GraphQLNamedType,
): Change<typeof ChangeType.TypeDescriptionAdded> {
  return typeDescriptionAddedFromMeta({
    type: ChangeType.TypeDescriptionAdded,
    meta: {
      typeName: type.name,
      addedTypeDescription: type.description ?? '',
    },
  });
}
