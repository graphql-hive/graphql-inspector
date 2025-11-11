import {
  ASTNode,
  ConstValueNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  Kind,
  parseConstValue,
  parseType,
  print,
  StringValueNode,
  TypeNode,
} from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  AddedAttributeCoordinateNotFoundError,
  AddedCoordinateAlreadyExistsError,
  ChangedAncestorCoordinateNotFoundError,
  ChangedCoordinateKindMismatchError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedAttributeNotFoundError,
  DeletedCoordinateNotFound,
  ValueMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import type { PatchConfig, PatchContext } from '../types';
import {
  assertValueMatch,
  getChangedNodeOfKind,
  getDeletedNodeOfKind,
  parentPath,
} from '../utils.js';

export function fieldTypeChanged(
  change: Change<typeof ChangeType.FieldTypeChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const node = getChangedNodeOfKind(change, nodeByPath, Kind.FIELD_DEFINITION, config);
  if (node) {
    const currentReturnType = print(node.type);
    if (change.meta.oldFieldType !== currentReturnType) {
      config.onError(
        new ValueMismatchError(Kind.FIELD_DEFINITION, change.meta.oldFieldType, currentReturnType),
        change,
      );
    }
    (node.type as TypeNode) = parseType(change.meta.newFieldType);
  }
}

export function fieldRemoved(
  change: Change<typeof ChangeType.FieldRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const typeNode = nodeByPath.get(parentPath(change.path)) as
    | (ASTNode & { fields?: FieldDefinitionNode[] })
    | undefined;
  if (!typeNode) {
    config.onError(
      new DeletedAncestorCoordinateNotFoundError(
        change.path,
        change.type,
        change.meta.removedFieldName,
      ),
      change,
    );
    return;
  }

  const beforeLength = typeNode.fields?.length ?? 0;
  typeNode.fields = typeNode.fields?.filter(f => f.name.value !== change.meta.removedFieldName);
  if (beforeLength === (typeNode.fields?.length ?? 0)) {
    config.onError(
      new DeletedAttributeNotFoundError(
        change.path,
        change.type,
        'fields',
        change.meta.removedFieldName,
      ),
      change,
    );
  } else {
    // delete the reference to the removed field.
    nodeByPath.delete(change.path);
  }
}

export function fieldAdded(
  change: Change<typeof ChangeType.FieldAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }
  const changedNode = nodeByPath.get(change.path);
  if (changedNode) {
    if (changedNode.kind === Kind.FIELD_DEFINITION) {
      if (print(changedNode.type) === change.meta.addedFieldReturnType) {
        config.onError(new AddedCoordinateAlreadyExistsError(change.path, change.type), change);
      } else {
        config.onError(
          new ValueMismatchError(
            Kind.FIELD_DEFINITION,
            undefined,
            change.meta.addedFieldReturnType,
          ),
          change,
        );
      }
    } else {
      config.onError(
        new ChangedCoordinateKindMismatchError(Kind.FIELD_DEFINITION, changedNode.kind),
        change,
      );
    }
    return;
  }
  const typeNode = nodeByPath.get(parentPath(change.path)) as ASTNode & {
    fields?: FieldDefinitionNode[];
  };
  if (!typeNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(
        change.path,
        change.type,
        change.meta.addedFieldName,
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
      new ChangedCoordinateKindMismatchError(Kind.ENUM_TYPE_DEFINITION, typeNode.kind),
      change,
    );
    return;
  }
  const node: FieldDefinitionNode = {
    kind: Kind.FIELD_DEFINITION,
    name: nameNode(change.meta.addedFieldName),
    type: parseType(change.meta.addedFieldReturnType),
    // description: change.meta.addedFieldDescription
    //   ? stringNode(change.meta.addedFieldDescription)
    //   : undefined,
  };

  typeNode.fields = [...(typeNode.fields ?? []), node];

  // add new field to the node set
  nodeByPath.set(change.path, node);
}

export function fieldArgumentAdded(
  change: Change<typeof ChangeType.FieldArgumentAdded>,
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
    config.onError(new AddedCoordinateAlreadyExistsError(change.path, change.type), change);
    return;
  }

  const fieldNode = nodeByPath.get(parentPath(change.path!)) as ASTNode & {
    arguments?: InputValueDefinitionNode[];
  };
  if (!fieldNode) {
    config.onError(
      new AddedAttributeCoordinateNotFoundError(
        change.path,
        change.type,
        change.meta.addedArgumentName,
      ),
      change,
    );
    return;
  }
  if (fieldNode.kind !== Kind.FIELD_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind),
      change,
    );
    return;
  }
  const node: InputValueDefinitionNode = {
    kind: Kind.INPUT_VALUE_DEFINITION,
    name: nameNode(change.meta.addedArgumentName),
    type: parseType(change.meta.addedArgumentType),
    // description: change.meta.addedArgumentDescription
    //   ? stringNode(change.meta.addedArgumentDescription)
    //   : undefined,
  };

  fieldNode.arguments = [...(fieldNode.arguments ?? []), node];

  // add new field to the node set
  nodeByPath.set(change.path!, node);
}

export function fieldArgumentTypeChanged(
  change: Change<typeof ChangeType.FieldArgumentTypeChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const existingArg = getChangedNodeOfKind(change, nodeByPath, Kind.INPUT_VALUE_DEFINITION, config);
  if (existingArg) {
    assertValueMatch(
      change,
      Kind.INPUT_VALUE_DEFINITION,
      change.meta.oldArgumentType,
      print(existingArg.type),
      config,
    );
    (existingArg.type as TypeNode) = parseType(change.meta.newArgumentType);
  }
}

export function fieldArgumentDescriptionChanged(
  change: Change<typeof ChangeType.FieldArgumentDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const existingArg = getChangedNodeOfKind(change, nodeByPath, Kind.INPUT_VALUE_DEFINITION, config);
  if (existingArg) {
    assertValueMatch(
      change,
      Kind.INPUT_VALUE_DEFINITION,
      change.meta.oldDescription ?? undefined,
      existingArg.description?.value,
      config,
    );
    (existingArg.description as StringValueNode | undefined) = change.meta.newDescription
      ? stringNode(change.meta.newDescription)
      : undefined;
  }
}

export function fieldArgumentDefaultChanged(
  change: Change<typeof ChangeType.FieldArgumentDefaultChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const existingArg = getChangedNodeOfKind(change, nodeByPath, Kind.INPUT_VALUE_DEFINITION, config);
  if (existingArg) {
    assertValueMatch(
      change,
      Kind.INPUT_VALUE_DEFINITION,
      change.meta.oldDefaultValue,
      existingArg.defaultValue && print(existingArg.defaultValue),
      config,
    );
    (existingArg.defaultValue as ConstValueNode | undefined) = change.meta.newDefaultValue
      ? parseConstValue(change.meta.newDefaultValue)
      : undefined;
  }
}

export function fieldArgumentRemoved(
  change: Change<typeof ChangeType.FieldArgumentRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const existing = getDeletedNodeOfKind(change, nodeByPath, Kind.ARGUMENT, config);
  if (!existing) {
    config.onError(new DeletedCoordinateNotFound(change.path ?? '', change.type), change);
    return;
  }

  const fieldNode = nodeByPath.get(parentPath(change.path!)) as ASTNode & {
    arguments?: InputValueDefinitionNode[];
  };
  if (!fieldNode) {
    config.onError(
      new DeletedAncestorCoordinateNotFoundError(
        change.path!, // asserted by "getDeletedNodeOfKind"
        change.type,
        change.meta.removedFieldArgumentName,
      ),
      change,
    );
    return;
  }
  if (fieldNode.kind !== Kind.FIELD_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind),
      change,
    );
  }
  fieldNode.arguments = fieldNode.arguments?.filter(
    a => a.name.value === change.meta.removedFieldArgumentName,
  );

  // add new field to the node set
  nodeByPath.delete(change.path!);
}

export function fieldDescriptionAdded(
  change: Change<typeof ChangeType.FieldDescriptionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const fieldNode = getChangedNodeOfKind(change, nodeByPath, Kind.FIELD_DEFINITION, config);
  if (fieldNode) {
    (fieldNode.description as StringValueNode | undefined) = change.meta.addedDescription
      ? stringNode(change.meta.addedDescription)
      : undefined;
  }
}

export function fieldDescriptionRemoved(
  change: Change<typeof ChangeType.FieldDescriptionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const fieldNode = nodeByPath.get(change.path);
  if (!fieldNode) {
    config.onError(new DeletedCoordinateNotFound(change.path, change.type), change);
    return;
  }
  if (fieldNode.kind !== Kind.FIELD_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind),
      change,
    );
    return;
  }

  (fieldNode.description as StringValueNode | undefined) = undefined;
}

export function fieldDescriptionChanged(
  change: Change<typeof ChangeType.FieldDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const fieldNode = getChangedNodeOfKind(change, nodeByPath, Kind.FIELD_DEFINITION, config);
  if (!fieldNode) {
    return;
  }
  if (fieldNode.description?.value !== change.meta.oldDescription) {
    config.onError(
      new ValueMismatchError(
        Kind.FIELD_DEFINITION,
        change.meta.oldDescription,
        fieldNode.description?.value,
      ),
      change,
    );
  }

  (fieldNode.description as StringValueNode | undefined) = stringNode(change.meta.newDescription);
}
