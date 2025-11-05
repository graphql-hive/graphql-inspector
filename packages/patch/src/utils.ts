import { ASTKindToNode, ASTNode, Kind, NameNode } from 'graphql';
import { Maybe } from 'graphql/jsutils/Maybe';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  ChangedCoordinateKindMismatchError,
  ChangedCoordinateNotFoundError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedCoordinateNotFound,
  NodeAttribute,
  ValueMismatchError,
} from './errors.js';
import { AdditionChangeType, PatchConfig } from './types.js';

export function findNamedNode<T extends { readonly name: NameNode }>(
  nodes: Maybe<ReadonlyArray<T>>,
  name: string,
): T | undefined {
  return nodes?.find(value => value.name.value === name);
}

export function deleteNamedNode<T extends { readonly name: NameNode }>(
  nodes: Maybe<ReadonlyArray<T>>,
  name: string,
): ReadonlyArray<T> | undefined {
  if (nodes) {
    const idx = nodes.findIndex(value => value.name.value === name);
    return idx >= 0 ? nodes.toSpliced(idx, 1) : nodes;
  }
}

export function parentPath(path: string) {
  const lastDividerIndex = path.lastIndexOf('.');
  return lastDividerIndex === -1 ? path : path.substring(0, lastDividerIndex);
}

const isAdditionChange = (change: Change<any>): change is Change<AdditionChangeType> => {
  switch (change.type) {
    case ChangeType.DirectiveAdded:
    case ChangeType.DirectiveArgumentAdded:
    case ChangeType.DirectiveLocationAdded:
    case ChangeType.EnumValueAdded:
    case ChangeType.EnumValueDeprecationReasonAdded:
    case ChangeType.FieldAdded:
    case ChangeType.FieldArgumentAdded:
    case ChangeType.FieldDeprecationAdded:
    case ChangeType.FieldDeprecationReasonAdded:
    case ChangeType.FieldDescriptionAdded:
    case ChangeType.InputFieldAdded:
    case ChangeType.InputFieldDescriptionAdded:
    case ChangeType.ObjectTypeInterfaceAdded:
    case ChangeType.TypeDescriptionAdded:
    case ChangeType.TypeAdded:
    case ChangeType.UnionMemberAdded:
    case ChangeType.DirectiveUsageArgumentAdded:
    case ChangeType.DirectiveUsageArgumentDefinitionAdded:
    case ChangeType.DirectiveUsageEnumAdded:
    case ChangeType.DirectiveUsageEnumValueAdded:
    case ChangeType.DirectiveUsageFieldAdded:
    case ChangeType.DirectiveUsageFieldDefinitionAdded:
    case ChangeType.DirectiveUsageInputFieldDefinitionAdded:
    case ChangeType.DirectiveUsageInputObjectAdded:
    case ChangeType.DirectiveUsageInterfaceAdded:
    case ChangeType.DirectiveUsageObjectAdded:
    case ChangeType.DirectiveUsageScalarAdded:
    case ChangeType.DirectiveUsageSchemaAdded:
    case ChangeType.DirectiveUsageUnionMemberAdded:
      return true;
    default:
      return false;
  }
};

export function debugPrintChange(change: Change<any>, nodeByPath: Map<string, ASTNode>) {
  if (isAdditionChange(change)) {
    console.debug(`"${change.path}" is being added to the schema.`);
  } else {
    const changedNode = (change.path && nodeByPath.get(change.path)) || false;

    if (changedNode) {
      console.debug(`"${change.path}" has a change: [${change.type}] "${change.message}"`);
    } else {
      console.debug(
        `The "${change.type}" change to "${change.path}" cannot be applied. That coordinate does not exist in the schema.`,
      );
    }
  }
}

export function assertValueMatch(
  change: Change<any>,
  expectedKind: Kind,
  expected: string | undefined,
  actual: string | undefined,
  config: PatchConfig,
) {
  if (expected !== actual) {
    config.onError(new ValueMismatchError(expectedKind, expected, actual), change);
  }
}

/**
 * Handles verifying the change object has a path, that the node exists in the
 * nodeByPath Map, and that the found node is the expected Kind.
 */
export function getChangedNodeOfKind<K extends Kind>(
  change: Change<any>,
  nodeByPath: Map<string, ASTNode>,
  kind: K,
  config: PatchConfig,
): ASTKindToNode[K] | void {
  if (kind === Kind.DIRECTIVE) {
    throw new Error('Directives cannot be found using this method.');
  }
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const existing = nodeByPath.get(change.path);
  if (!existing) {
    config.onError(new ChangedCoordinateNotFoundError(kind, undefined), change);
    return;
  }
  if (existing.kind !== kind) {
    config.onError(new ChangedCoordinateKindMismatchError(kind, existing.kind), change);
  }
  return existing as ASTKindToNode[K];
}

export function getDeletedNodeOfKind<K extends Kind>(
  change: Change<any>,
  nodeByPath: Map<string, ASTNode>,
  kind: K,
  config: PatchConfig,
): ASTKindToNode[K] | void {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }
  const existing = nodeByPath.get(change.path);
  if (!existing) {
    config.onError(new DeletedCoordinateNotFound(kind, undefined), change);
    return;
  }
  if (existing.kind !== kind) {
    config.onError(new ChangedCoordinateKindMismatchError(kind, existing.kind), change);
    return;
  }
  return existing as ASTKindToNode[K];
}

export function getDeletedParentNodeOfKind<K extends Kind>(
  change: Change<any>,
  nodeByPath: Map<string, ASTNode>,
  kind: K,
  attribute: NodeAttribute,
  config: PatchConfig,
): ASTKindToNode[K] | void {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }
  const existing = nodeByPath.get(parentPath(change.path));
  if (!existing) {
    config.onError(new DeletedAncestorCoordinateNotFoundError(kind, attribute, undefined), change);
    return;
  }
  if (existing.kind !== kind) {
    config.onError(new ChangedCoordinateKindMismatchError(kind, existing.kind), change);
    return;
  }
  return existing as ASTKindToNode[K];
}
