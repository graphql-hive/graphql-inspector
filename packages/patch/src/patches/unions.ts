import { ASTNode, Kind, NamedTypeNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  AddedAttributeAlreadyExistsError,
  ChangedAncestorCoordinateNotFoundError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedAttributeNotFoundError,
} from '../errors.js';
import { namedTypeNode } from '../node-templates.js';
import { PatchConfig, PatchContext } from '../types.js';
import { findNamedNode, parentPath } from '../utils.js';

export function unionMemberAdded(
  change: Change<typeof ChangeType.UnionMemberAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }
  const union = nodeByPath.get(parentPath(change.path)) as
    | (ASTNode & { types?: NamedTypeNode[] })
    | undefined;
  if (!union) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(Kind.UNION_TYPE_DEFINITION, 'types'),
      change,
    );
    return;
  }

  if (findNamedNode(union.types, change.meta.addedUnionMemberTypeName)) {
    config.onError(
      new AddedAttributeAlreadyExistsError(
        Kind.UNION_TYPE_DEFINITION,
        'types',
        change.meta.addedUnionMemberTypeName,
      ),
      change,
    );
    return;
  }

  union.types = [...(union.types ?? []), namedTypeNode(change.meta.addedUnionMemberTypeName)];
}

export function unionMemberRemoved(
  change: Change<typeof ChangeType.UnionMemberRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }
  const union = nodeByPath.get(parentPath(change.path)) as
    | (ASTNode & { types?: NamedTypeNode[] })
    | undefined;
  if (!union) {
    config.onError(
      new DeletedAncestorCoordinateNotFoundError(
        Kind.UNION_TYPE_DEFINITION,
        'types',
        change.meta.removedUnionMemberTypeName,
      ),
      change,
    );
    return;
  }

  if (!findNamedNode(union.types, change.meta.removedUnionMemberTypeName)) {
    config.onError(
      new DeletedAttributeNotFoundError(
        Kind.UNION_TYPE_DEFINITION,
        'types',
        change.meta.removedUnionMemberTypeName,
      ),
      change,
    );
    return;
  }

  union.types = union.types!.filter(t => t.name.value !== change.meta.removedUnionMemberTypeName);
}
