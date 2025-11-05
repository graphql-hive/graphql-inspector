import {
  ASTNode,
  ConstValueNode,
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
  DeletedCoordinateNotFound,
  ValueMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import type { PatchConfig, PatchContext } from '../types.js';
import {
  assertValueMatch,
  getChangedNodeOfKind,
  getDeletedNodeOfKind,
  parentPath,
} from '../utils.js';

export function inputFieldAdded(
  change: Change<typeof ChangeType.InputFieldAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const existingNode = nodeByPath.get(change.path);
  if (existingNode) {
    if (existingNode.kind === Kind.INPUT_VALUE_DEFINITION) {
      config.onError(
        new AddedCoordinateAlreadyExistsError(
          Kind.INPUT_VALUE_DEFINITION,
          change.meta.addedInputFieldName,
        ),
        change,
      );
    } else {
      config.onError(
        new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, existingNode.kind),
        change,
      );
    }
    return;
  }
  const typeNode = nodeByPath.get(parentPath(change.path)) as ASTNode & {
    fields?: InputValueDefinitionNode[];
  };
  if (!typeNode) {
    config.onError(
      new AddedAttributeCoordinateNotFoundError(
        change.meta.inputName,
        'fields',
        change.meta.addedInputFieldName,
      ),
      change,
    );
    return;
  }
  if (typeNode.kind !== Kind.INPUT_OBJECT_TYPE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.INPUT_OBJECT_TYPE_DEFINITION, typeNode.kind),
      change,
    );
    return;
  }

  const node: InputValueDefinitionNode = {
    kind: Kind.INPUT_VALUE_DEFINITION,
    name: nameNode(change.meta.addedInputFieldName),
    type: parseType(change.meta.addedInputFieldType),
    // description: change.meta.addedInputFieldDescription
    //   ? stringNode(change.meta.addedInputFieldDescription)
    //   : undefined,
  };

  typeNode.fields = [...(typeNode.fields ?? []), node];

  // add new field to the node set
  nodeByPath.set(change.path, node);
}

export function inputFieldRemoved(
  change: Change<typeof ChangeType.InputFieldRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const existingNode = nodeByPath.get(change.path);
  if (!existingNode) {
    config.onError(
      new DeletedCoordinateNotFound(
        Kind.INPUT_OBJECT_TYPE_DEFINITION,
        change.meta.removedFieldName,
      ),
      change,
    );
    return;
  }

  const typeNode = nodeByPath.get(parentPath(change.path)) as ASTNode & {
    fields?: InputValueDefinitionNode[];
  };
  if (!typeNode) {
    config.onError(
      new DeletedAncestorCoordinateNotFoundError(
        Kind.INPUT_OBJECT_TYPE_DEFINITION,
        'fields',
        change.meta.removedFieldName,
      ),
      change,
    );
    return;
  }

  if (typeNode.kind !== Kind.INPUT_OBJECT_TYPE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.INPUT_OBJECT_TYPE_DEFINITION, typeNode.kind),
      change,
    );
    return;
  }

  typeNode.fields = typeNode.fields?.filter(f => f.name.value !== change.meta.removedFieldName);

  // add new field to the node set
  nodeByPath.delete(change.path);
}

export function inputFieldDescriptionAdded(
  change: Change<typeof ChangeType.InputFieldDescriptionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }
  const existingNode = nodeByPath.get(change.path);
  if (!existingNode) {
    config.onError(
      new DeletedAncestorCoordinateNotFoundError(
        Kind.INPUT_VALUE_DEFINITION,
        'description',
        change.meta.addedInputFieldDescription,
      ),
      change,
    );
    return;
  }
  if (existingNode.kind !== Kind.INPUT_VALUE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, existingNode.kind),
      change,
    );
    return;
  }

  (existingNode.description as StringValueNode | undefined) = stringNode(
    change.meta.addedInputFieldDescription,
  );
}

export function inputFieldTypeChanged(
  change: Change<typeof ChangeType.InputFieldTypeChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const inputFieldNode = getChangedNodeOfKind(
    change,
    nodeByPath,
    Kind.INPUT_VALUE_DEFINITION,
    config,
  );
  if (inputFieldNode) {
    assertValueMatch(
      change,
      Kind.INPUT_VALUE_DEFINITION,
      change.meta.oldInputFieldType,
      print(inputFieldNode.type),
      config,
    );

    (inputFieldNode.type as TypeNode) = parseType(change.meta.newInputFieldType);
  }
}

export function inputFieldDefaultValueChanged(
  change: Change<typeof ChangeType.InputFieldDefaultValueChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }
  const existingNode = nodeByPath.get(change.path);
  if (!existingNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(Kind.INPUT_VALUE_DEFINITION, 'defaultValue'),
      change,
    );
    return;
  }

  if (existingNode.kind !== Kind.INPUT_VALUE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, existingNode.kind),
      change,
    );
    return;
  }

  const oldValueMatches =
    (existingNode.defaultValue && print(existingNode.defaultValue)) === change.meta.oldDefaultValue;
  if (!oldValueMatches) {
    config.onError(
      new ValueMismatchError(
        existingNode.defaultValue?.kind ?? Kind.INPUT_VALUE_DEFINITION,
        change.meta.oldDefaultValue,
        existingNode.defaultValue && print(existingNode.defaultValue),
      ),
      change,
    );
  }
  (existingNode.defaultValue as ConstValueNode | undefined) = change.meta.newDefaultValue
    ? parseConstValue(change.meta.newDefaultValue)
    : undefined;
}

export function inputFieldDescriptionChanged(
  change: Change<typeof ChangeType.InputFieldDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const existingNode = getChangedNodeOfKind(
    change,
    nodeByPath,
    Kind.INPUT_VALUE_DEFINITION,
    config,
  );
  if (!existingNode) {
    return;
  }
  if (existingNode.description?.value !== change.meta.oldInputFieldDescription) {
    config.onError(
      new ValueMismatchError(
        Kind.STRING,
        change.meta.oldInputFieldDescription,
        existingNode.description?.value,
      ),
      change,
    );
  }
  (existingNode.description as StringValueNode | undefined) = stringNode(
    change.meta.newInputFieldDescription,
  );
}

export function inputFieldDescriptionRemoved(
  change: Change<typeof ChangeType.InputFieldDescriptionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const existingNode = getDeletedNodeOfKind(
    change,
    nodeByPath,
    Kind.INPUT_VALUE_DEFINITION,
    config,
  );
  if (!existingNode) {
    return;
  }

  if (existingNode.description === undefined) {
    console.warn(`Cannot remove a description at ${change.path} because no description is set.`);
  } else if (existingNode.description.value !== change.meta.removedDescription) {
    console.warn(
      `Description at ${change.path} does not match expected description, but proceeding with description removal anyways.`,
    );
  }
  (existingNode.description as StringValueNode | undefined) = undefined;
}
