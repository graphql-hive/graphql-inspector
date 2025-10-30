import {
  ASTKindToNode,
  ASTNode,
  DirectiveNode,
  GraphQLDeprecatedDirective,
  Kind,
  NameNode,
} from 'graphql';
import { Maybe } from 'graphql/jsutils/Maybe';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  ChangedCoordinateKindMismatchError,
  ChangedCoordinateNotFoundError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedCoordinateNotFound,
  handleError,
  NodeAttribute,
  ValueMismatchError,
} from './errors.js';
import { AdditionChangeType, PatchConfig } from './types.js';

export function getDeprecatedDirectiveNode(
  definitionNode: Maybe<{ readonly directives?: ReadonlyArray<DirectiveNode> }>,
): Maybe<DirectiveNode> {
  return findNamedNode(definitionNode?.directives, GraphQLDeprecatedDirective.name);
}

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

export const DEPRECATION_REASON_DEFAULT = 'No longer supported';

export function assertChangeHasPath<C extends Change<any>>(
  change: C,
  config: PatchConfig,
): change is typeof change & { path: string } {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return false;
  }
  return true;
}

export function assertValueMatch(
  change: Change<any>,
  expectedKind: Kind,
  expected: string | undefined,
  actual: string | undefined,
  config: PatchConfig,
) {
  if (expected !== actual) {
    handleError(change, new ValueMismatchError(expectedKind, expected, actual), config);
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
  if (assertChangeHasPath(change, config)) {
    const existing = nodeByPath.get(change.path);
    if (!existing) {
      handleError(
        change,
        // @todo improve the error by providing the name or value somehow.
        new ChangedCoordinateNotFoundError(kind, undefined),
        config,
      );
    } else if (existing.kind === kind) {
      return existing as ASTKindToNode[K];
    } else {
      handleError(change, new ChangedCoordinateKindMismatchError(kind, existing.kind), config);
    }
  }
}

export function getDeletedNodeOfKind<K extends Kind>(
  change: Change<any>,
  nodeByPath: Map<string, ASTNode>,
  kind: K,
  config: PatchConfig,
): ASTKindToNode[K] | void {
  if (assertChangeHasPath(change, config)) {
    const existing = nodeByPath.get(change.path);
    if (!existing) {
      handleError(
        change,
        // @todo improve the error by providing the name or value somehow.
        new DeletedCoordinateNotFound(kind, undefined),
        config,
      );
    } else if (existing.kind === kind) {
      return existing as ASTKindToNode[K];
    } else {
      handleError(change, new ChangedCoordinateKindMismatchError(kind, existing.kind), config);
    }
  }
}

export function getDeletedParentNodeOfKind<K extends Kind>(
  change: Change<any>,
  nodeByPath: Map<string, ASTNode>,
  kind: K,
  attribute: NodeAttribute,
  config: PatchConfig,
): ASTKindToNode[K] | void {
  if (assertChangeHasPath(change, config)) {
    const existing = nodeByPath.get(parentPath(change.path));
    if (!existing) {
      handleError(
        change,
        // @todo improve the error by providing the name or value somehow.
        new DeletedAncestorCoordinateNotFoundError(kind, attribute, undefined),
        config,
      );
    } else if (existing.kind === kind) {
      return existing as ASTKindToNode[K];
    } else {
      handleError(change, new ChangedCoordinateKindMismatchError(kind, existing.kind), config);
    }
  }
}
