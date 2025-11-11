import { ASTNode, Kind, NamedTypeNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  AddedAttributeAlreadyExistsError,
  ChangedAncestorCoordinateNotFoundError,
  ChangedCoordinateKindMismatchError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedCoordinateNotFound,
} from '../errors.js';
import { namedTypeNode } from '../node-templates.js';
import type { PatchConfig, PatchContext } from '../types';
import { findNamedNode } from '../utils.js';

export function objectTypeInterfaceAdded(
  change: Change<typeof ChangeType.ObjectTypeInterfaceAdded>,
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
      new ChangedAncestorCoordinateNotFoundError(
        change.path,
        change.type,
        change.meta.addedInterfaceName,
      ),
      change,
    );
    return;
  }

  if (
    typeNode.kind !== Kind.OBJECT_TYPE_DEFINITION &&
    typeNode.kind !== Kind.INTERFACE_TYPE_DEFINITION
  ) {
    config.onError(
      new ChangedCoordinateKindMismatchError(
        Kind.OBJECT_TYPE_DEFINITION, // or Kind.INTERFACE_TYPE_DEFINITION
        typeNode.kind,
      ),
      change,
    );
    return;
  }

  const existing = findNamedNode(typeNode.interfaces, change.meta.addedInterfaceName);
  if (existing) {
    config.onError(
      new AddedAttributeAlreadyExistsError(
        change.path,
        change.type,
        'interfaces',
        change.meta.addedInterfaceName,
      ),
      change,
    );
    return;
  }

  (typeNode.interfaces as NamedTypeNode[] | undefined) = [
    ...(typeNode.interfaces ?? []),
    namedTypeNode(change.meta.addedInterfaceName),
  ];
}

export function objectTypeInterfaceRemoved(
  change: Change<typeof ChangeType.ObjectTypeInterfaceRemoved>,
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
        change.path,
        change.type,
        change.meta.removedInterfaceName,
      ),
      change,
    );
    return;
  }

  if (
    typeNode.kind !== Kind.OBJECT_TYPE_DEFINITION &&
    typeNode.kind !== Kind.INTERFACE_TYPE_DEFINITION
  ) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
      change,
    );
    return;
  }

  const existing = findNamedNode(typeNode.interfaces, change.meta.removedInterfaceName);
  if (!existing) {
    config.onError(new DeletedCoordinateNotFound(change.path, change.type), change);
    return;
  }

  (typeNode.interfaces as NamedTypeNode[] | undefined) = typeNode.interfaces?.filter(
    i => i.name.value !== change.meta.removedInterfaceName,
  );
}
