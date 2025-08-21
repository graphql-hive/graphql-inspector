import type { SchemaDefinitionNode, SchemaExtensionNode } from 'graphql';
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
   * By default does not throw when hitting errors such as if
   * a type that was modified no longer exists.
   */
  throwOnError?: boolean;

  /**
   * By default does not require the value at time of change to match
   * what's currently in the schema. Enable this if you need to be extra
   * cautious when detecting conflicts.
   */
  requireOldValueMatch?: boolean;

  /**
   * Allows handling errors more granularly if you only care about specific types of
   * errors or want to capture the errors in a list somewhere etc. If 'true' is returned
   * then this error is considered handled and the default error handling will not
   * be ran.
   * To halt patching, throw the error inside the handler.
   * @param err The raised error
   * @returns True if the error has been handled
   */
  onError?: (err: Error) => boolean | undefined | null;

  /**
   * Enables debug logging
   */
  debug?: boolean;
};
