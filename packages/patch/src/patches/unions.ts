import { ASTNode, NamedTypeNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  CoordinateNotFoundError,
  handleError,
  UnionMemberAlreadyExistsError,
  UnionMemberNotFoundError,
} from '../errors.js';
import { namedTypeNode } from '../node-templates.js';
import { PatchConfig } from '../types.js';
import { parentPath } from '../utils.js';

export function unionMemberAdded(
  change: Change<typeof ChangeType.UnionMemberAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const union = nodeByPath.get(parentPath(changedPath)) as
    | (ASTNode & { types?: NamedTypeNode[] })
    | undefined;
  if (union) {
    if (union.types?.some(n => n.name.value === change.meta.addedUnionMemberTypeName)) {
      handleError(
        change,
        new UnionMemberAlreadyExistsError(
          change.meta.unionName,
          change.meta.addedUnionMemberTypeName,
        ),
        config,
      );
    } else {
      union.types = [...(union.types ?? []), namedTypeNode(change.meta.addedUnionMemberTypeName)];
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}

export function unionMemberRemoved(
  change: Change<typeof ChangeType.UnionMemberRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const union = nodeByPath.get(parentPath(changedPath)) as
    | (ASTNode & { types?: NamedTypeNode[] })
    | undefined;
  if (union) {
    if (union.types?.some(n => n.name.value === change.meta.removedUnionMemberTypeName)) {
      union.types = union.types.filter(
        t => t.name.value !== change.meta.removedUnionMemberTypeName,
      );
    } else {
      handleError(change, new UnionMemberNotFoundError(), config);
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}
