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
   * By default does not throw when hitting errors such as if
   * a type that was modified no longer exists.
   */
  throwOnError?: boolean;

  /**
   * The changes output from `diff` include the values, such as default argument values of the old schema. E.g. changing `foo(arg: String = "bar")` to `foo(arg: String = "foo")` would track that the previous default value was `"bar"`. By enabling this option, `patch` can throw an error when patching a schema where the value doesn't match what is expected. E.g. where `foo.arg`'s default value is _NOT_ `"bar"`. This will avoid overwriting conflicting changes. This is recommended if using an automated process for patching schema.
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
  onError?: (err: Error, change: Change<any>) => boolean | undefined | null;

  /**
   * Enables debug logging
   */
  debug?: boolean;
};

export type PatchContext = {
  /**
   * tracks which nodes have have their directives removed so that patch can
   * go back and filter out the null records in the lists.
   */
  removedDirectiveNodes: Array<{ directives?: DirectiveNode[] }>;
};
