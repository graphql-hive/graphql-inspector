import { ASTNode, isTypeDefinitionNode, Kind, StringValueNode, TypeDefinitionNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  AddedCoordinateAlreadyExistsError,
  ChangedCoordinateKindMismatchError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedCoordinateNotFound,
  handleError,
  ValueMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import type { PatchConfig } from '../types';

export function typeAdded(
  change: Change<typeof ChangeType.TypeAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const existing = nodeByPath.get(change.path);
  if (existing) {
    handleError(
      change,
      new AddedCoordinateAlreadyExistsError(existing.kind, change.meta.addedTypeName),
      config,
    );
  } else {
    const node: TypeDefinitionNode = {
      name: nameNode(change.meta.addedTypeName),
      kind: change.meta.addedTypeKind as TypeDefinitionNode['kind'],
    };
    nodeByPath.set(change.path, node);
  }
}

export function typeRemoved(
  change: Change<typeof ChangeType.TypeRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const removedNode = nodeByPath.get(change.path);
  if (removedNode) {
    if (isTypeDefinitionNode(removedNode)) {
      // delete the reference to the removed field.
      for (const key of nodeByPath.keys()) {
        if (key.startsWith(change.path)) {
          nodeByPath.delete(key);
        }
      }
    } else {
      handleError(
        change,
        new DeletedCoordinateNotFound(removedNode.kind, change.meta.removedTypeName),
        config,
      );
    }
  } else {
    handleError(
      change,
      new DeletedCoordinateNotFound(Kind.OBJECT_TYPE_DEFINITION, change.meta.removedTypeName),
      config,
    );
  }
}

export function typeDescriptionAdded(
  change: Change<typeof ChangeType.TypeDescriptionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const typeNode = nodeByPath.get(change.path);
  if (typeNode) {
    if (isTypeDefinitionNode(typeNode)) {
      (typeNode.description as StringValueNode | undefined) = change.meta.addedTypeDescription
        ? stringNode(change.meta.addedTypeDescription)
        : undefined;
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
        config,
      );
    }
  } else {
    handleError(change, new ChangePathMissingError(change), config);
  }
}

export function typeDescriptionChanged(
  change: Change<typeof ChangeType.TypeDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const typeNode = nodeByPath.get(change.path);
  if (typeNode) {
    if (isTypeDefinitionNode(typeNode)) {
      if (typeNode.description?.value !== change.meta.oldTypeDescription) {
        handleError(
          change,
          new ValueMismatchError(
            Kind.STRING,
            change.meta.oldTypeDescription,
            typeNode.description?.value,
          ),
          config,
        );
      }
      (typeNode.description as StringValueNode | undefined) = stringNode(
        change.meta.newTypeDescription,
      );
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
        config,
      );
    }
  } else {
    handleError(change, new ChangePathMissingError(change), config);
  }
}

export function typeDescriptionRemoved(
  change: Change<typeof ChangeType.TypeDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const typeNode = nodeByPath.get(change.path);
  if (typeNode) {
    if (isTypeDefinitionNode(typeNode)) {
      if (typeNode.description?.value !== change.meta.oldTypeDescription) {
        handleError(
          change,
          new ValueMismatchError(
            Kind.STRING,
            change.meta.oldTypeDescription,
            typeNode.description?.value,
          ),
          config,
        );
      }
      (typeNode.description as StringValueNode | undefined) = undefined;
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.OBJECT_TYPE_DEFINITION, typeNode.kind),
        config,
      );
    }
  } else {
    handleError(
      change,
      new DeletedAncestorCoordinateNotFoundError(
        Kind.OBJECT_TYPE_DEFINITION,
        'description',
        change.meta.oldTypeDescription,
      ),
      config,
    );
  }
}
