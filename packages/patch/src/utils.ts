import {
  ASTNode,
  DirectiveNode,
  GraphQLDeprecatedDirective,
  NameNode,
} from 'graphql';
import { Maybe } from 'graphql/jsutils/Maybe';
import { Change, ChangeType } from '@graphql-inspector/core';
import { AdditionChangeType } from './types.js';

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
        `The change to "${change.path}" cannot be applied. That coordinate does not exist in the schema.`,
      );
    }
  }
}
