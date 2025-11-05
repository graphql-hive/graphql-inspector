import type { DirectiveNode, SchemaDefinitionNode, SchemaExtensionNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';

export type AdditionChangeType =
  | typeof ChangeType.DirectiveAdded
  | typeof ChangeType.DirectiveArgumentAdded
  | typeof ChangeType.DirectiveLocationAdded
  | typeof ChangeType.EnumValueAdded
  | typeof ChangeType.EnumValueDeprecationReasonAdded
  | typeof ChangeType.FieldAdded
  | typeof ChangeType.FieldArgumentAdded
  | typeof ChangeType.FieldDeprecationAdded
  | typeof ChangeType.FieldDeprecationReasonAdded
  | typeof ChangeType.FieldDescriptionAdded
  | typeof ChangeType.InputFieldAdded
  | typeof ChangeType.InputFieldDescriptionAdded
  | typeof ChangeType.ObjectTypeInterfaceAdded
  | typeof ChangeType.TypeDescriptionAdded
  | typeof ChangeType.TypeAdded
  | typeof ChangeType.UnionMemberAdded;

export type SchemaNode = SchemaDefinitionNode | SchemaExtensionNode;

export type TypeOfChangeType = (typeof ChangeType)[keyof typeof ChangeType];

export type ChangesByType = { [key in TypeOfChangeType]?: Array<Change<key>> };

export type PatchConfig = {
  /**
   * Allows handling errors more granularly if you only care about specific types of
   * errors or want to capture the errors in a list somewhere etc.
   *
   * To halt patching, throw the error inside the handler.
   * @param err The raised error
   * @returns void
   */
  onError: (err: Error, change: Change<any>) => void;

  /**
   * Enables debug logging
   */
  debug: boolean;
};

export type PatchContext = {
  /**
   * tracks which nodes have have their directives removed so that patch can
   * go back and filter out the null records in the lists.
   */
  removedDirectiveNodes: Array<{ directives?: DirectiveNode[] }>;
};

export type ErrorHandler = (err: Error, change: Change<any>) => void;
