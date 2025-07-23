import {
  ArgumentNode,
  ASTNode,
  ConstDirectiveNode,
  ConstValueNode,
  DirectiveNode,
  GraphQLDeprecatedDirective,
  InputValueDefinitionNode,
  Kind,
  NameNode,
  StringValueNode,
  TypeNode,
  ValueNode,
} from 'graphql';
import { Maybe } from 'graphql/jsutils/Maybe';
import { Change, ChangeType } from '@graphql-inspector/core';
import { nameNode } from './node-templates.js';
import { AdditionChangeType } from './types.js';

export function getDeprecatedDirectiveNode(
  definitionNode: Maybe<{ readonly directives?: ReadonlyArray<DirectiveNode> }>,
): Maybe<DirectiveNode> {
  return definitionNode?.directives?.find(
    node => node.name.value === GraphQLDeprecatedDirective.name,
  );
}

export function addInputValueDefinitionArgument(
  node: Maybe<{
    arguments?: InputValueDefinitionNode[] | readonly InputValueDefinitionNode[] | undefined;
  }>,
  argumentName: string,
  type: TypeNode,
  defaultValue: ConstValueNode | undefined,
  description: StringValueNode | undefined,
  directives: ConstDirectiveNode[] | undefined,
): void {
  if (node) {
    let found = false;
    for (const arg of node.arguments ?? []) {
      if (arg.name.value === argumentName) {
        found = true;
        break;
      }
    }
    if (found) {
      console.error('Cannot patch definition that does not exist.');
      return;
    }

    node.arguments = [
      ...(node.arguments ?? []),
      {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: nameNode(argumentName),
        defaultValue,
        type,
        description,
        directives,
      },
    ];
  }
}

export function removeInputValueDefinitionArgument(
  node: Maybe<{
    arguments?: InputValueDefinitionNode[] | readonly InputValueDefinitionNode[] | undefined;
  }>,
  argumentName: string,
): void {
  if (node?.arguments) {
    node.arguments = node.arguments.filter(({ name }) => name.value !== argumentName);
  } else {
    // @todo throw and standardize error messages
    console.warn('Cannot apply input value argument removal.');
  }
}

export function setInputValueDefinitionArgument(
  node: Maybe<{
    arguments?: InputValueDefinitionNode[] | readonly InputValueDefinitionNode[] | undefined;
  }>,
  argumentName: string,
  values: {
    type?: TypeNode;
    defaultValue?: ConstValueNode | undefined;
    description?: StringValueNode | undefined;
    directives?: ConstDirectiveNode[] | undefined;
  },
): void {
  if (node) {
    let found = false;
    for (const arg of node.arguments ?? []) {
      if (arg.name.value === argumentName) {
        if (Object.hasOwn(values, 'type') && values.type !== undefined) {
          (arg.type as TypeNode) = values.type;
        }
        if (Object.hasOwn(values, 'defaultValue')) {
          (arg.defaultValue as ConstValueNode | undefined) = values.defaultValue;
        }
        if (Object.hasOwn(values, 'description')) {
          (arg.description as StringValueNode | undefined) = values.description;
        }
        if (Object.hasOwn(values, 'directives')) {
          (arg.directives as ConstDirectiveNode[] | undefined) = values.directives;
        }
        found = true;
        break;
      }
    }
    if (!found) {
      console.error('Cannot patch definition that does not exist.');
      // @todo throw error?
    }
  }
}

export function upsertArgument(
  node: { arguments?: ArgumentNode[] | readonly ArgumentNode[] },
  argumentName: string,
  value: ValueNode,
): ArgumentNode {
  for (const arg of node.arguments ?? []) {
    if (arg.name.value === argumentName) {
      (arg.value as ValueNode) = value;
      return arg;
    }
  }
  const arg: ArgumentNode = {
    kind: Kind.ARGUMENT,
    name: nameNode(argumentName),
    value,
  };
  node.arguments = [...(node.arguments ?? []), arg];
  return arg;
}

export function findNamedNode<T extends { readonly name: NameNode }>(
  nodes: Maybe<ReadonlyArray<T>>,
  name: string,
): T | undefined {
  return nodes?.find(value => value.name.value === name);
}

/**
 * @returns the removed node or undefined if no node matches the name.
 */
export function removeNamedNode<T extends { readonly name: NameNode }>(
  nodes: Maybe<Array<T>>,
  name: string,
): T | undefined {
  if (nodes) {
    const index = nodes?.findIndex(node => node.name.value === name);
    if (index !== -1) {
      const [deleted] = nodes.splice(index, 1);
      return deleted;
    }
  }
}

export function removeArgument(
  node: Maybe<{ arguments?: ArgumentNode[] | readonly ArgumentNode[] | undefined }>,
  argumentName: string,
): void {
  if (node?.arguments) {
    node.arguments = node.arguments.filter(arg => arg.name.value !== argumentName);
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
      return true;
    default:
      return false;
  }
};

export function debugPrintChange(change: Change<any>, nodeByPath: Map<string, ASTNode>) {
  if (isAdditionChange(change)) {
    console.log(`"${change.path}" is being added to the schema.`);
  } else {
    const changedNode = (change.path && nodeByPath.get(change.path)) || false;

    if (changedNode) {
      console.log(`"${change.path}" has a change: [${change.type}] "${change.message}"`);
    } else {
      console.log(
        `The change to "${change.path}" cannot be applied. That coordinate does not exist in the schema.`,
      );
    }
  }
}
