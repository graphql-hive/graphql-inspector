import type { SchemaDefinitionNode, SchemaExtensionNode } from 'graphql';
import type { Change, ChangeType } from '@graphql-inspector/core';

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
  throwOnError?: boolean;
  debug?: boolean;
};
