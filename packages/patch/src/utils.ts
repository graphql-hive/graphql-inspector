import { ASTKindToNode, ASTNode, DirectiveNode, GraphQLDeprecatedDirective, Kind, NameNode } from 'graphql';
import { Maybe } from 'graphql/jsutils/Maybe';
import { Change, ChangeType } from '@graphql-inspector/core';
import { AdditionChangeType, PatchConfig } from './types.js';
import { ChangedCoordinateKindMismatchError, ChangedCoordinateNotFoundError, ChangePathMissingError, handleError } from './errors.js';

export function getDeprecatedDirectiveNode(
  definitionNode: Maybe<{ readonly directives?: ReadonlyArray<DirectiveNode> }>,
): Maybe<DirectiveNode> {
  return findNamedNode(definitionNode?.directives, `@${GraphQLDeprecatedDirective.name}`);
}

export function findNamedNode<T extends { readonly name: NameNode }>(
  nodes: Maybe<ReadonlyArray<T>>,
  name: string,
): T | undefined {
  return nodes?.find(value => value.name.value === name);
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

export function assertChangeHasPath(change: Change<any>, config: PatchConfig): change is typeof change & { path: string } {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(), config);
    return false;
  }
  return true;
}

/**
 * Handles verifying the change object has a path, that the node exists in the
 * nodeByPath Map, and that the found node is the expected Kind.
 */
export function getChangedNodeOfKind<K extends Kind>(
  change: Change<any>,
  nodeByPath: Map<string, ASTNode>,
  kind: K,
  config: PatchConfig
): ASTKindToNode[K] | void {
  if (assertChangeHasPath(change, config)) {
    const existing = nodeByPath.get(change.path);
    if (!existing) {
      handleError(
        change,
        new ChangedCoordinateNotFoundError(
          Kind.INPUT_VALUE_DEFINITION,
          change.meta.argumentName,
        ),
        config,
      );
    } else if (existing.kind === kind) {
      return existing as ASTKindToNode[K];
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(
          kind,
          existing.kind,
        ),
        config,
      );
    }
  }
}