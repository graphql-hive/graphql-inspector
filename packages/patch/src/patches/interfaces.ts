import { ASTNode, Kind, NamedTypeNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  AddedAttributeAlreadyExistsError,
  ChangedAncestorCoordinateNotFoundError,
  ChangedCoordinateKindMismatchError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedCoordinateNotFound,
  handleError,
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
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const typeNode = nodeByPath.get(change.path);
  if (!typeNode) {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(Kind.OBJECT_TYPE_DEFINITION, 'interfaces'),
      config,
    );
    return;
  }

  if (
    typeNode.kind !== Kind.OBJECT_TYPE_DEFINITION &&
    typeNode.kind !== Kind.INTERFACE_TYPE_DEFINITION
  ) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(
        Kind.OBJECT_TYPE_DEFINITION, // or Kind.INTERFACE_TYPE_DEFINITION
        typeNode.kind,
      ),
      config,
    );
    return;
  }

  const existing = findNamedNode(typeNode.interfaces, change.meta.addedInterfaceName);
  if (existing) {
    handleError(
      change,
      new AddedAttributeAlreadyExistsError(
        typeNode.kind,
        'interfaces',
        change.meta.addedInterfaceName,
      ),
      config,
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
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const typeNode = nodeByPath.get(change.path);
  if (!typeNode) {
    handleError(
      change,
      new DeletedAncestorCoordinateNotFoundError(
        Kind.INPUT_OBJECT_TYPE_DEFINITION,
        'interfaces',
        change.meta.removedInterfaceName,
      ),
      config,
    );
    return;
  }

  if (
    typeNode.kind !== Kind.OBJECT_TYPE_DEFINITION &&
    typeNode.kind !== Kind.INTERFACE_TYPE_DEFINITION
  ) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
      config,
    );
    return;
  }

  const existing = findNamedNode(typeNode.interfaces, change.meta.removedInterfaceName);
  if (!existing) {
    handleError(
      change,
      new DeletedCoordinateNotFound(
        Kind.INTERFACE_TYPE_DEFINITION,
        change.meta.removedInterfaceName,
      ),
      config,
    );
    return;
  }

  (typeNode.interfaces as NamedTypeNode[] | undefined) = typeNode.interfaces?.filter(
    i => i.name.value !== change.meta.removedInterfaceName,
  );
}
