import { ASTNode, isTypeDefinitionNode, Kind, StringValueNode, TypeDefinitionNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  CoordinateAlreadyExistsError,
  CoordinateNotFoundError,
  DescriptionMismatchError,
  handleError,
  KindMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import type { PatchConfig } from '../types';

export function typeAdded(
  change: Change<typeof ChangeType.TypeAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const existing = nodeByPath.get(changedPath);
  if (existing) {
    handleError(change, new CoordinateAlreadyExistsError(existing.kind), config);
  } else {
    const node: TypeDefinitionNode = {
      name: nameNode(change.meta.addedTypeName),
      kind: change.meta.addedTypeKind as TypeDefinitionNode['kind'],
    };
    // @todo is this enough?
    nodeByPath.set(changedPath, node);
  }
}

export function typeRemoved(
  removal: Change<typeof ChangeType.TypeRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = removal.path!;
  const removedNode = nodeByPath.get(changedPath);
  if (removedNode) {
    if (isTypeDefinitionNode(removedNode)) {
      // delete the reference to the removed field.
      for (const key of nodeByPath.keys()) {
        if (key.startsWith(changedPath)) {
          nodeByPath.delete(key);
        }
      }
    } else {
      handleError(
        removal,
        new KindMismatchError(Kind.OBJECT_TYPE_DEFINITION, removedNode.kind),
        config,
      );
    }
  } else {
    handleError(removal, new CoordinateNotFoundError(), config);
  }
}

export function typeDescriptionAdded(
  change: Change<typeof ChangeType.TypeDescriptionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const typeNode = nodeByPath.get(changedPath);
  if (typeNode) {
    if (isTypeDefinitionNode(typeNode)) {
      (typeNode.description as StringValueNode | undefined) = change.meta.addedTypeDescription
        ? stringNode(change.meta.addedTypeDescription)
        : undefined;
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

export function typeDescriptionChanged(
  change: Change<typeof ChangeType.TypeDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const typeNode = nodeByPath.get(changedPath);
  if (typeNode) {
    if (isTypeDefinitionNode(typeNode)) {
      if (typeNode.description?.value !== change.meta.oldTypeDescription) {
        handleError(
          change,
          new DescriptionMismatchError(change.meta.oldTypeDescription, typeNode.description?.value),
          config,
        );
      }
      (typeNode.description as StringValueNode | undefined) = stringNode(
        change.meta.newTypeDescription,
      );
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

export function typeDescriptionRemoved(
  change: Change<typeof ChangeType.TypeDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const typeNode = nodeByPath.get(changedPath);
  if (typeNode) {
    if (isTypeDefinitionNode(typeNode)) {
      if (typeNode.description?.value !== change.meta.oldTypeDescription) {
        handleError(
          change,
          new DescriptionMismatchError(change.meta.oldTypeDescription, typeNode.description?.value),
          config,
        );
      }
      (typeNode.description as StringValueNode | undefined) = undefined;
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
