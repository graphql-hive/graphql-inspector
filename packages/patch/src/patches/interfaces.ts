import { ASTNode, Kind, NamedTypeNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  AddedAttributeAlreadyExistsError,
  ChangedAncestorCoordinateNotFoundError,
  ChangedCoordinateKindMismatchError,
  ChangePathMissingError,
  handleError,
} from '../errors.js';
import { namedTypeNode } from '../node-templates.js';
import type { PatchConfig } from '../types';
import { findNamedNode } from '../utils.js';

export function objectTypeInterfaceAdded(
  change: Change<typeof ChangeType.ObjectTypeInterfaceAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(), config);
    return;
  }

  const typeNode = nodeByPath.get(change.path);
  if (typeNode) {
    if (
      typeNode.kind === Kind.OBJECT_TYPE_DEFINITION ||
      typeNode.kind === Kind.INTERFACE_TYPE_DEFINITION
    ) {
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
      } else {
        (typeNode.interfaces as NamedTypeNode[] | undefined) = [
          ...(typeNode.interfaces ?? []),
          namedTypeNode(change.meta.addedInterfaceName),
        ];
      }
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(
          Kind.OBJECT_TYPE_DEFINITION, // or Kind.INTERFACE_TYPE_DEFINITION
          typeNode.kind,
        ),
        config,
      );
    }
  } else {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(Kind.OBJECT_TYPE_DEFINITION, 'interfaces'),
      config,
    );
  }
}

export function objectTypeInterfaceRemoved(
  change: Change<typeof ChangeType.ObjectTypeInterfaceRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(), config);
    return;
  }

  const typeNode = nodeByPath.get(change.path);
  if (typeNode) {
    if (
      typeNode.kind === Kind.OBJECT_TYPE_DEFINITION ||
      typeNode.kind === Kind.INTERFACE_TYPE_DEFINITION
    ) {
      const existing = findNamedNode(typeNode.interfaces, change.meta.removedInterfaceName);
      if (existing) {
        (typeNode.interfaces as NamedTypeNode[] | undefined) = typeNode.interfaces?.filter(
          i => i.name.value !== change.meta.removedInterfaceName,
        );
      } else {
        handleError(change, new ChangePathMissingError(), config);
      }
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
        config,
      );
    }
  } else {
    handleError(change, new ChangePathMissingError(), config);
  }
}
