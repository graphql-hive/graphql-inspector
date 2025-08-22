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
  ChangedCoordinateKindMismatchError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  handleError,
  ValueMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import type { PatchConfig } from '../types.js';
import { assertValueMatch, getChangedNodeOfKind, parentPath } from '../utils.js';

export function inputFieldAdded(
  change: Change<typeof ChangeType.InputFieldAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(), config);
    return;
  }

  const existingNode = nodeByPath.get(change.path);
  if (existingNode) {
    if (existingNode.kind === Kind.INPUT_VALUE_DEFINITION) {
      handleError(
        change,
        new AddedCoordinateAlreadyExistsError(
          Kind.INPUT_VALUE_DEFINITION,
          change.meta.addedInputFieldName,
        ),
        config,
      );
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, existingNode.kind),
        config,
      );
    }
  } else {
    const typeNode = nodeByPath.get(parentPath(change.path)) as ASTNode & {
      fields?: InputValueDefinitionNode[];
    };
    if (!typeNode) {
      handleError(
        change,
        new AddedAttributeCoordinateNotFoundError(Kind.INPUT_OBJECT_TYPE_DEFINITION, 'fields'),
        config,
      );
    } else if (typeNode.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION) {
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
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.INPUT_OBJECT_TYPE_DEFINITION, typeNode.kind),
        config,
      );
    }
  }
}

export function inputFieldRemoved(
  change: Change<typeof ChangeType.InputFieldRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(), config);
    return;
  }

  const existingNode = nodeByPath.get(change.path);
  if (existingNode) {
    const typeNode = nodeByPath.get(parentPath(change.path)) as ASTNode & {
      fields?: InputValueDefinitionNode[];
    };
    if (!typeNode) {
      handleError(
        change,
        new DeletedAncestorCoordinateNotFoundError(
          Kind.INPUT_OBJECT_TYPE_DEFINITION,
          'fields',
          change.meta.removedFieldName,
        ),
        config,
      );
    } else if (typeNode.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION) {
      typeNode.fields = typeNode.fields?.filter(f => f.name.value !== change.meta.removedFieldName);

      // add new field to the node set
      nodeByPath.delete(change.path);
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.INPUT_OBJECT_TYPE_DEFINITION, typeNode.kind),
        config,
      );
    }
  } else {
    handleError(change, new ChangePathMissingError(), config);
  }
}

export function inputFieldDescriptionAdded(
  change: Change<typeof ChangeType.InputFieldDescriptionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(), config);
    return;
  }
  const existingNode = nodeByPath.get(change.path);
  if (existingNode) {
    if (existingNode.kind === Kind.INPUT_VALUE_DEFINITION) {
      (existingNode.description as StringValueNode | undefined) = stringNode(
        change.meta.addedInputFieldDescription,
      );
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, existingNode.kind),
        config,
      );
    }
  } else {
    handleError(
      change,
      new DeletedAncestorCoordinateNotFoundError(
        Kind.INPUT_VALUE_DEFINITION,
        'description',
        change.meta.addedInputFieldDescription,
      ),
      config,
    );
  }
}

export function inputFieldTypeChanged(
  change: Change<typeof ChangeType.InputFieldTypeChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
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
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(), config);
    return;
  }
  const existingNode = nodeByPath.get(change.path);
  if (existingNode) {
    if (existingNode.kind === Kind.INPUT_VALUE_DEFINITION) {
      const oldValueMatches =
        (existingNode.defaultValue && print(existingNode.defaultValue)) ===
        change.meta.oldDefaultValue;
      if (!oldValueMatches) {
        handleError(
          change,
          new ValueMismatchError(
            existingNode.defaultValue?.kind ?? Kind.INPUT_VALUE_DEFINITION,
            change.meta.oldDefaultValue,
            existingNode.defaultValue && print(existingNode.defaultValue),
          ),
          config,
        );
      }
      (existingNode.defaultValue as ConstValueNode | undefined) = change.meta.newDefaultValue
        ? parseConstValue(change.meta.newDefaultValue)
        : undefined;
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, existingNode.kind),
        config,
      );
    }
  } else {
    handleError(change, new ChangePathMissingError(), config);
  }
}

export function inputFieldDescriptionChanged(
  change: Change<typeof ChangeType.InputFieldDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(), config);
    return;
  }
  const existingNode = nodeByPath.get(change.path);
  if (existingNode) {
    if (existingNode.kind === Kind.INPUT_VALUE_DEFINITION) {
      if (existingNode.description?.value !== change.meta.oldInputFieldDescription) {
        handleError(
          change,
          new ValueMismatchError(
            Kind.STRING,
            change.meta.oldInputFieldDescription,
            existingNode.description?.value,
          ),
          config,
        );
      }
      (existingNode.description as StringValueNode | undefined) = stringNode(
        change.meta.newInputFieldDescription,
      );
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, existingNode.kind),
        config,
      );
    }
  } else {
    handleError(change, new ChangePathMissingError(), config);
  }
}

export function inputFieldDescriptionRemoved(
  change: Change<typeof ChangeType.InputFieldDescriptionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(), config);
    return;
  }

  const existingNode = nodeByPath.get(change.path);
  if (existingNode) {
    if (existingNode.kind === Kind.INPUT_VALUE_DEFINITION) {
      if (existingNode.description === undefined) {
        console.warn(
          `Cannot remove a description at ${change.path} because no description is set.`,
        );
      } else if (existingNode.description.value !== change.meta.removedDescription) {
        console.warn(
          `Description at ${change.path} does not match expected description, but proceeding with description removal anyways.`,
        );
      }
      (existingNode.description as StringValueNode | undefined) = undefined;
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, existingNode.kind),
        config,
      );
    }
  } else {
    handleError(
      change,
      new DeletedAncestorCoordinateNotFoundError(
        Kind.INPUT_VALUE_DEFINITION,
        'description',
        change.meta.removedDescription,
      ),
      config,
    );
  }
}
