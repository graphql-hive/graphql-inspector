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
  ChangedCoordinateKindMismatchError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedAttributeNotFoundError,
  DeletedCoordinateNotFound,
  handleError,
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
      handleError(
        change,
        new ValueMismatchError(Kind.FIELD_DEFINITION, change.meta.oldFieldType, currentReturnType),
        config,
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
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const typeNode = nodeByPath.get(parentPath(change.path)) as
    | (ASTNode & { fields?: FieldDefinitionNode[] })
    | undefined;
  if (!typeNode) {
    handleError(
      change,
      new DeletedAncestorCoordinateNotFoundError(
        Kind.OBJECT_TYPE_DEFINITION,
        'fields',
        change.meta.removedFieldName,
      ),
      config,
    );
    return;
  }

  const beforeLength = typeNode.fields?.length ?? 0;
  typeNode.fields = typeNode.fields?.filter(f => f.name.value !== change.meta.removedFieldName);
  if (beforeLength === (typeNode.fields?.length ?? 0)) {
    handleError(
      change,
      new DeletedAttributeNotFoundError(typeNode?.kind, 'fields', change.meta.removedFieldName),
      config,
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
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }
  const changedNode = nodeByPath.get(change.path);
  if (changedNode) {
    if (changedNode.kind === Kind.OBJECT_FIELD) {
      handleError(
        change,
        new AddedCoordinateAlreadyExistsError(changedNode.kind, change.meta.addedFieldName),
        config,
      );
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.OBJECT_FIELD, changedNode.kind),
        config,
      );
    }
  } else {
    const typeNode = nodeByPath.get(parentPath(change.path)) as ASTNode & {
      fields?: FieldDefinitionNode[];
    };
    if (!typeNode) {
      handleError(change, new ChangePathMissingError(change), config);
    } else if (
      typeNode.kind !== Kind.OBJECT_TYPE_DEFINITION &&
      typeNode.kind !== Kind.INTERFACE_TYPE_DEFINITION
    ) {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.ENUM_TYPE_DEFINITION, typeNode.kind),
        config,
      );
    } else {
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
  }
}

export function fieldArgumentAdded(
  change: Change<typeof ChangeType.FieldArgumentAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const existing = nodeByPath.get(change.path);
  if (existing) {
    handleError(
      change,
      new AddedCoordinateAlreadyExistsError(Kind.ARGUMENT, change.meta.addedArgumentName),
      config,
    );
    return;
  }

  const fieldNode = nodeByPath.get(parentPath(change.path!)) as ASTNode & {
    arguments?: InputValueDefinitionNode[];
  };
  if (!fieldNode) {
    handleError(
      change,
      new AddedAttributeCoordinateNotFoundError(
        change.meta.fieldName,
        'arguments',
        change.meta.addedArgumentName,
      ),
      config,
    );
    return;
  }
  if (fieldNode.kind !== Kind.FIELD_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind),
      config,
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
    handleError(
      change,
      new DeletedCoordinateNotFound(Kind.ARGUMENT, change.meta.removedFieldArgumentName),
      config,
    );
    return;
  }

  const fieldNode = nodeByPath.get(parentPath(change.path!)) as ASTNode & {
    arguments?: InputValueDefinitionNode[];
  };
  if (!fieldNode) {
    handleError(
      change,
      new DeletedAncestorCoordinateNotFoundError(
        Kind.FIELD_DEFINITION,
        'arguments',
        change.meta.removedFieldArgumentName,
      ),
      config,
    );
    return;
  }
  if (fieldNode.kind !== Kind.FIELD_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind),
      config,
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
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const fieldNode = nodeByPath.get(change.path);
  if (!fieldNode) {
    handleError(
      change,
      new DeletedCoordinateNotFound(Kind.FIELD_DEFINITION, change.meta.fieldName),
      config,
    );
    return;
  }
  if (fieldNode.kind !== Kind.FIELD_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind),
      config,
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
    handleError(
      change,
      new ValueMismatchError(
        Kind.FIELD_DEFINITION,
        change.meta.oldDescription,
        fieldNode.description?.value,
      ),
      config,
    );
  }

  (fieldNode.description as StringValueNode | undefined) = stringNode(change.meta.newDescription);
}
