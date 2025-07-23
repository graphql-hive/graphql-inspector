import { ASTNode, DirectiveNode, Kind } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  CoordinateAlreadyExistsError,
  CoordinateNotFoundError,
  DeletedCoordinateNotFoundError,
  handleError,
} from '../errors.js';
import { nameNode } from '../node-templates.js';
import { PatchConfig, SchemaNode } from '../types.js';
import { parentPath } from '../utils.js';

export type DirectiveUsageAddedChange =
  | typeof ChangeType.DirectiveUsageArgumentDefinitionAdded
  | typeof ChangeType.DirectiveUsageInputFieldDefinitionAdded
  | typeof ChangeType.DirectiveUsageInputObjectAdded
  | typeof ChangeType.DirectiveUsageInterfaceAdded
  | typeof ChangeType.DirectiveUsageObjectAdded
  | typeof ChangeType.DirectiveUsageEnumAdded
  | typeof ChangeType.DirectiveUsageFieldDefinitionAdded
  | typeof ChangeType.DirectiveUsageUnionMemberAdded
  | typeof ChangeType.DirectiveUsageEnumValueAdded
  | typeof ChangeType.DirectiveUsageSchemaAdded
  | typeof ChangeType.DirectiveUsageScalarAdded
  | typeof ChangeType.DirectiveUsageFieldAdded;

export type DirectiveUsageRemovedChange =
  | typeof ChangeType.DirectiveUsageArgumentDefinitionRemoved
  | typeof ChangeType.DirectiveUsageInputFieldDefinitionRemoved
  | typeof ChangeType.DirectiveUsageInputObjectRemoved
  | typeof ChangeType.DirectiveUsageInterfaceRemoved
  | typeof ChangeType.DirectiveUsageObjectRemoved
  | typeof ChangeType.DirectiveUsageEnumRemoved
  | typeof ChangeType.DirectiveUsageFieldDefinitionRemoved
  | typeof ChangeType.DirectiveUsageFieldRemoved
  | typeof ChangeType.DirectiveUsageUnionMemberRemoved
  | typeof ChangeType.DirectiveUsageEnumValueRemoved
  | typeof ChangeType.DirectiveUsageSchemaRemoved
  | typeof ChangeType.DirectiveUsageScalarRemoved;

function directiveUsageDefinitionAdded(
  change: Change<DirectiveUsageAddedChange>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new CoordinateNotFoundError(), config);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  const parentNode = nodeByPath.get(parentPath(change.path)) as
    | { directives?: DirectiveNode[] }
    | undefined;
  if (directiveNode) {
    handleError(change, new CoordinateAlreadyExistsError(directiveNode.kind), config);
  } else if (parentNode) {
    const newDirective: DirectiveNode = {
      kind: Kind.DIRECTIVE,
      name: nameNode(change.meta.addedDirectiveName),
    };
    parentNode.directives = [...(parentNode.directives ?? []), newDirective];
    nodeByPath.set(change.path, newDirective);
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}

function directiveUsageDefinitionRemoved(
  change: Change<DirectiveUsageRemovedChange>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new CoordinateNotFoundError(), config);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  const parentNode = nodeByPath.get(parentPath(change.path)) as
    | { directives?: DirectiveNode[] }
    | undefined;
  if (directiveNode && parentNode) {
    parentNode.directives = parentNode.directives?.filter(
      d => d.name.value !== change.meta.removedDirectiveName,
    );
    nodeByPath.delete(change.path);
  } else {
    handleError(change, new DeletedCoordinateNotFoundError(), config);
  }
}

export function directiveUsageArgumentDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageArgumentDefinitionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageArgumentDefinitionRemoved(
  change: Change<typeof ChangeType.DirectiveUsageArgumentDefinitionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageEnumAdded(
  change: Change<typeof ChangeType.DirectiveUsageEnumAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageEnumRemoved(
  change: Change<typeof ChangeType.DirectiveUsageEnumRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageEnumValueAdded(
  change: Change<typeof ChangeType.DirectiveUsageEnumValueAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageEnumValueRemoved(
  change: Change<typeof ChangeType.DirectiveUsageEnumValueRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageFieldAdded(
  change: Change<typeof ChangeType.DirectiveUsageFieldAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageFieldDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageFieldDefinitionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageFieldDefinitionRemoved(
  change: Change<typeof ChangeType.DirectiveUsageFieldDefinitionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageFieldRemoved(
  change: Change<typeof ChangeType.DirectiveUsageFieldRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageInputFieldDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageInputFieldDefinitionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageInputFieldDefinitionRemoved(
  change: Change<typeof ChangeType.DirectiveUsageInputFieldDefinitionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageInputObjectAdded(
  change: Change<typeof ChangeType.DirectiveUsageInputObjectAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageInputObjectRemoved(
  change: Change<typeof ChangeType.DirectiveUsageInputObjectRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageInterfaceAdded(
  change: Change<typeof ChangeType.DirectiveUsageInterfaceAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageInterfaceRemoved(
  change: Change<typeof ChangeType.DirectiveUsageInterfaceRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageObjectAdded(
  change: Change<typeof ChangeType.DirectiveUsageObjectAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageObjectRemoved(
  change: Change<typeof ChangeType.DirectiveUsageObjectRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageScalarAdded(
  change: Change<typeof ChangeType.DirectiveUsageScalarAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageScalarRemoved(
  change: Change<typeof ChangeType.DirectiveUsageScalarRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageSchemaAdded(
  _change: Change<typeof ChangeType.DirectiveUsageSchemaAdded>,
  _schemaDefs: SchemaNode[],
  _config: PatchConfig,
) {
  // @todo
  // return directiveUsageDefinitionAdded(change, schemaDefs, config);
}

export function directiveUsageSchemaRemoved(
  _change: Change<typeof ChangeType.DirectiveUsageSchemaRemoved>,
  _schemaDefs: SchemaNode[],
  _config: PatchConfig,
) {
  // @todo
  // return directiveUsageDefinitionRemoved(change, schemaDefs, config);
}

export function directiveUsageUnionMemberAdded(
  change: Change<typeof ChangeType.DirectiveUsageUnionMemberAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageUnionMemberRemoved(
  change: Change<typeof ChangeType.DirectiveUsageUnionMemberRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}
