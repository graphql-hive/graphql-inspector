import { ASTNode, Kind, NamedTypeNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  CoordinateNotFoundError,
  handleError,
  InterfaceAlreadyExistsOnTypeError,
  KindMismatchError,
} from '../errors.js';
import { namedTypeNode } from '../node-templates.js';
import type { PatchConfig } from '../types';

export function objectTypeInterfaceAdded(
  change: Change<typeof ChangeType.ObjectTypeInterfaceAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const typeNode = nodeByPath.get(changedPath);
  if (typeNode) {
    if (
      typeNode.kind === Kind.OBJECT_TYPE_DEFINITION ||
      typeNode.kind === Kind.INTERFACE_TYPE_DEFINITION
    ) {
      const existing = typeNode.interfaces?.find(
        i => i.name.value === change.meta.addedInterfaceName,
      );
      if (existing) {
        handleError(
          change,
          new InterfaceAlreadyExistsOnTypeError(change.meta.addedInterfaceName),
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
        new KindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
        config,
      );
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}

export function objectTypeInterfaceRemoved(
  change: Change<typeof ChangeType.ObjectTypeInterfaceRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const typeNode = nodeByPath.get(changedPath);
  if (typeNode) {
    if (
      typeNode.kind === Kind.OBJECT_TYPE_DEFINITION ||
      typeNode.kind === Kind.INTERFACE_TYPE_DEFINITION
    ) {
      const existing = typeNode.interfaces?.find(
        i => i.name.value === change.meta.removedInterfaceName,
      );
      if (existing) {
        (typeNode.interfaces as NamedTypeNode[] | undefined) = typeNode.interfaces?.filter(
          i => i.name.value !== change.meta.removedInterfaceName,
        );
      } else {
        handleError(change, new CoordinateNotFoundError(), config);
      }
    } else {
      handleError(
        change,
        new KindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
        config,
      );
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}
