import { ASTNode, EnumValueDefinitionNode, Kind, StringValueNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  AddedAttributeAlreadyExistsError,
  ChangedAncestorCoordinateNotFoundError,
  ChangedCoordinateKindMismatchError,
  ChangePathMissingError,
  DeletedAttributeNotFoundError,
  DeletedCoordinateNotFound,
  ValueMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import type { PatchConfig, PatchContext } from '../types';
import { parentPath } from '../utils.js';

export function enumValueRemoved(
  change: Change<typeof ChangeType.EnumValueRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const enumNode = nodeByPath.get(parentPath(change.path)) as
    | (ASTNode & { values?: EnumValueDefinitionNode[] })
    | undefined;
  if (!enumNode) {
    config.onError(
      new DeletedCoordinateNotFound(Kind.ENUM_TYPE_DEFINITION, change.meta.removedEnumValueName),
      change,
    );
    return;
  }

  if (enumNode.kind !== Kind.ENUM_TYPE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.ENUM_TYPE_DEFINITION, enumNode.kind),
      change,
    );
    return;
  }

  if (enumNode.values === undefined || enumNode.values.length === 0) {
    config.onError(
      new DeletedAttributeNotFoundError(
        Kind.ENUM_TYPE_DEFINITION,
        'values',
        change.meta.removedEnumValueName,
      ),
      change,
    );
    return;
  }

  const beforeLength = enumNode.values.length;
  enumNode.values = enumNode.values.filter(f => f.name.value !== change.meta.removedEnumValueName);
  if (beforeLength === enumNode.values.length) {
    config.onError(
      new DeletedAttributeNotFoundError(
        Kind.ENUM_TYPE_DEFINITION,
        'values',
        change.meta.removedEnumValueName,
      ),
      change,
    );
    return;
  }

  // delete the reference to the removed field.
  nodeByPath.delete(change.path);
}

export function enumValueAdded(
  change: Change<typeof ChangeType.EnumValueAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const enumValuePath = change.path!;
  const enumNode = nodeByPath.get(parentPath(enumValuePath)) as
    | (ASTNode & { values: EnumValueDefinitionNode[] })
    | undefined;
  const changedNode = nodeByPath.get(enumValuePath);
  if (!enumNode) {
    config.onError(new ChangedAncestorCoordinateNotFoundError(Kind.ENUM, 'values'), change);
    return;
  }

  if (changedNode) {
    config.onError(
      new AddedAttributeAlreadyExistsError(
        changedNode.kind,
        'values',
        change.meta.addedEnumValueName,
      ),
      change,
    );
    return;
  }

  if (enumNode.kind !== Kind.ENUM_TYPE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.ENUM_TYPE_DEFINITION, enumNode.kind),
      change,
    );
    return;
  }

  const c = change as Change<typeof ChangeType.EnumValueAdded>;
  const node: EnumValueDefinitionNode = {
    kind: Kind.ENUM_VALUE_DEFINITION,
    name: nameNode(c.meta.addedEnumValueName),
    description: c.meta.addedDirectiveDescription
      ? stringNode(c.meta.addedDirectiveDescription)
      : undefined,
  };
  (enumNode.values as EnumValueDefinitionNode[]) = [...(enumNode.values ?? []), node];
  nodeByPath.set(enumValuePath, node);
}

export function enumValueDescriptionChanged(
  change: Change<typeof ChangeType.EnumValueDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const enumValueNode = nodeByPath.get(change.path);
  if (!enumValueNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(Kind.ENUM_VALUE_DEFINITION, 'values'),
      change,
    );
    return;
  }

  if (enumValueNode.kind !== Kind.ENUM_VALUE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.ENUM_VALUE_DEFINITION, enumValueNode.kind),
      change,
    );
    return;
  }

  const oldValueMatches =
    change.meta.oldEnumValueDescription === (enumValueNode.description?.value ?? null);
  if (!oldValueMatches) {
    config.onError(
      new ValueMismatchError(
        Kind.ENUM_TYPE_DEFINITION,
        change.meta.oldEnumValueDescription,
        enumValueNode.description?.value,
      ),
      change,
    );
  }
  (enumValueNode.description as StringValueNode | undefined) = change.meta.newEnumValueDescription
    ? stringNode(change.meta.newEnumValueDescription)
    : undefined;
}
