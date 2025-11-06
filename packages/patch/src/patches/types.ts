import { ASTNode, isTypeDefinitionNode, Kind, StringValueNode, TypeDefinitionNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  AddedCoordinateAlreadyExistsError,
  ChangedAncestorCoordinateNotFoundError,
  ChangedCoordinateKindMismatchError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedCoordinateNotFound,
  ValueMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import type { PatchConfig, PatchContext } from '../types';

export function typeAdded(
  change: Change<typeof ChangeType.TypeAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const existing = nodeByPath.get(change.path);
  if (existing) {
    config.onError(
      new AddedCoordinateAlreadyExistsError(existing.kind, change.meta.addedTypeName),
      change,
    );
    return;
  }
  const node: TypeDefinitionNode = {
    name: nameNode(change.meta.addedTypeName),
    kind: change.meta.addedTypeKind as TypeDefinitionNode['kind'],
  };
  nodeByPath.set(change.path, node);
}

export function typeRemoved(
  change: Change<typeof ChangeType.TypeRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const removedNode = nodeByPath.get(change.path);
  if (!removedNode) {
    config.onError(
      new DeletedCoordinateNotFound(Kind.OBJECT_TYPE_DEFINITION, change.meta.removedTypeName),
      change,
    );
    return;
  }

  if (!isTypeDefinitionNode(removedNode)) {
    config.onError(
      new DeletedCoordinateNotFound(removedNode.kind, change.meta.removedTypeName),
      change,
    );
    return;
  }

  // delete the reference to the removed field.
  for (const key of nodeByPath.keys()) {
    if (key.startsWith(change.path)) {
      nodeByPath.delete(key);
    }
  }
}

export function typeDescriptionAdded(
  change: Change<typeof ChangeType.TypeDescriptionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const typeNode = nodeByPath.get(change.path);
  if (!typeNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(Kind.OBJECT_TYPE_DEFINITION, 'description'),
      change,
    );
    return;
  }
  if (!isTypeDefinitionNode(typeNode)) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
      change,
    );
    return;
  }

  (typeNode.description as StringValueNode | undefined) = change.meta.addedTypeDescription
    ? stringNode(change.meta.addedTypeDescription)
    : undefined;
}

export function typeDescriptionChanged(
  change: Change<typeof ChangeType.TypeDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const typeNode = nodeByPath.get(change.path);
  if (!typeNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(Kind.OBJECT_TYPE_DEFINITION, 'description'),
      change,
    );
    return;
  }

  if (!isTypeDefinitionNode(typeNode)) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
      change,
    );
    return;
  }
  if (typeNode.description?.value !== change.meta.oldTypeDescription) {
    config.onError(
      new ValueMismatchError(
        Kind.STRING,
        change.meta.oldTypeDescription,
        typeNode.description?.value,
      ),
      change,
    );
  }
  (typeNode.description as StringValueNode | undefined) = stringNode(
    change.meta.newTypeDescription,
  );
}

export function typeDescriptionRemoved(
  change: Change<typeof ChangeType.TypeDescriptionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const typeNode = nodeByPath.get(change.path);
  if (!typeNode) {
    config.onError(
      new DeletedAncestorCoordinateNotFoundError(
        Kind.OBJECT_TYPE_DEFINITION,
        'description',
        change.meta.removedTypeDescription,
      ),
      change,
    );
    return;
  }

  if (!isTypeDefinitionNode(typeNode)) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
      change,
    );
    return;
  }

  if (typeNode.description?.value !== change.meta.removedTypeDescription) {
    config.onError(
      new ValueMismatchError(
        Kind.STRING,
        change.meta.removedTypeDescription,
        typeNode.description?.value,
      ),
      change,
    );
  }
  (typeNode.description as StringValueNode | undefined) = undefined;
}
