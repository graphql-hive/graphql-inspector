import {
  ArgumentNode,
  ASTNode,
  ConstValueNode,
  DirectiveNode,
  FieldDefinitionNode,
  GraphQLDeprecatedDirective,
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
  AddedAttributeAlreadyExistsError,
  AddedAttributeCoordinateNotFoundError,
  AddedCoordinateAlreadyExistsError,
  ChangedCoordinateKindMismatchError,
  ChangedCoordinateNotFoundError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedAttributeNotFoundError,
  DeletedCoordinateNotFound,
  handleError,
  ValueMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import type { PatchConfig } from '../types';
import {
  assertChangeHasPath,
  assertValueMatch,
  DEPRECATION_REASON_DEFAULT,
  findNamedNode,
  getChangedNodeOfKind,
  getDeletedNodeOfKind,
  getDeprecatedDirectiveNode,
  parentPath,
} from '../utils.js';

export function fieldTypeChanged(
  change: Change<typeof ChangeType.FieldTypeChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
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
  } else {
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
}

export function fieldAdded(
  change: Change<typeof ChangeType.FieldAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (assertChangeHasPath(change, config)) {
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
}

export function fieldArgumentAdded(
  change: Change<typeof ChangeType.FieldArgumentAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (assertChangeHasPath(change, config)) {
    const existing = nodeByPath.get(change.path);
    if (existing) {
      handleError(
        change,
        new AddedCoordinateAlreadyExistsError(Kind.ARGUMENT, change.meta.addedArgumentName),
        config,
      );
    } else {
      const fieldNode = nodeByPath.get(parentPath(change.path!)) as ASTNode & {
        arguments?: InputValueDefinitionNode[];
      };
      if (!fieldNode) {
        handleError(
          change,
          new AddedAttributeCoordinateNotFoundError(Kind.FIELD_DEFINITION, 'arguments'),
          config,
        );
      } else if (fieldNode.kind === Kind.FIELD_DEFINITION) {
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
      } else {
        handleError(
          change,
          new ChangedCoordinateKindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind),
          config,
        );
      }
    }
  }
}

export function fieldArgumentTypeChanged(
  change: Change<typeof ChangeType.FieldArgumentTypeChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
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
) {
  const existing = getDeletedNodeOfKind(change, nodeByPath, Kind.ARGUMENT, config);
  if (existing) {
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
    } else if (fieldNode.kind === Kind.FIELD_DEFINITION) {
      fieldNode.arguments = fieldNode.arguments?.filter(
        a => a.name.value === change.meta.removedFieldArgumentName,
      );

      // add new field to the node set
      nodeByPath.delete(change.path!);
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind),
        config,
      );
    }
  }
}

export function fieldDeprecationReasonChanged(
  change: Change<typeof ChangeType.FieldDeprecationReasonChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const deprecationNode = getChangedNodeOfKind(change, nodeByPath, Kind.DIRECTIVE, config);
  if (deprecationNode) {
    const reasonArgument = findNamedNode(deprecationNode.arguments, 'reason');
    if (reasonArgument) {
      if (print(reasonArgument.value) !== change.meta.oldDeprecationReason) {
        handleError(
          change,
          new ValueMismatchError(
            Kind.ARGUMENT,
            print(reasonArgument.value),
            change.meta.oldDeprecationReason,
          ),
          config,
        );
      }

      const node = {
        kind: Kind.ARGUMENT,
        name: nameNode('reason'),
        value: stringNode(change.meta.newDeprecationReason),
      } as ArgumentNode;
      (deprecationNode.arguments as ArgumentNode[] | undefined) = [
        ...(deprecationNode.arguments ?? []),
        node,
      ];
    } else {
      handleError(change, new ChangedCoordinateNotFoundError(Kind.ARGUMENT, 'reason'), config);
    }
  }
}

export function fieldDeprecationReasonAdded(
  change: Change<typeof ChangeType.FieldDeprecationReasonAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const deprecationNode = getChangedNodeOfKind(change, nodeByPath, Kind.DIRECTIVE, config);
  if (deprecationNode) {
    const reasonArgument = findNamedNode(deprecationNode.arguments, 'reason');
    if (reasonArgument) {
      handleError(
        change,
        new AddedAttributeAlreadyExistsError(Kind.DIRECTIVE, 'arguments', 'reason'),
        config,
      );
    } else {
      const node = {
        kind: Kind.ARGUMENT,
        name: nameNode('reason'),
        value: stringNode(change.meta.addedDeprecationReason),
      } as ArgumentNode;
      (deprecationNode.arguments as ArgumentNode[] | undefined) = [
        ...(deprecationNode.arguments ?? []),
        node,
      ];
      nodeByPath.set(`${change.path}.reason`, node);
    }
  }
}

export function fieldDeprecationAdded(
  change: Change<typeof ChangeType.FieldDeprecationAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const fieldNode = getChangedNodeOfKind(change, nodeByPath, Kind.FIELD_DEFINITION, config);
  if (fieldNode) {
    const hasExistingDeprecationDirective = getDeprecatedDirectiveNode(fieldNode);
    if (hasExistingDeprecationDirective) {
      handleError(
        change,
        new AddedCoordinateAlreadyExistsError(Kind.DIRECTIVE, '@deprecated'),
        config,
      );
    } else {
      const directiveNode = {
        kind: Kind.DIRECTIVE,
        name: nameNode(GraphQLDeprecatedDirective.name),
        ...(change.meta.deprecationReason &&
        change.meta.deprecationReason !== DEPRECATION_REASON_DEFAULT
          ? {
              arguments: [
                {
                  kind: Kind.ARGUMENT,
                  name: nameNode('reason'),
                  value: stringNode(change.meta.deprecationReason),
                },
              ],
            }
          : {}),
      } as DirectiveNode;

      (fieldNode.directives as DirectiveNode[] | undefined) = [
        ...(fieldNode.directives ?? []),
        directiveNode,
      ];
      nodeByPath.set([change.path, `@${GraphQLDeprecatedDirective.name}`].join(','), directiveNode);
    }
  }
}

export function fieldDeprecationRemoved(
  change: Change<typeof ChangeType.FieldDeprecationRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const fieldNode = getChangedNodeOfKind(change, nodeByPath, Kind.FIELD_DEFINITION, config);
  if (fieldNode) {
    const hasExistingDeprecationDirective = getDeprecatedDirectiveNode(fieldNode);
    if (hasExistingDeprecationDirective) {
      (fieldNode.directives as DirectiveNode[] | undefined) = fieldNode.directives?.filter(
        d => d.name.value !== GraphQLDeprecatedDirective.name,
      );
      nodeByPath.delete([change.path, `@${GraphQLDeprecatedDirective.name}`].join('.'));
    } else {
      handleError(change, new DeletedCoordinateNotFound(Kind.DIRECTIVE, '@deprecated'), config);
    }
  }
}

export function fieldDescriptionAdded(
  change: Change<typeof ChangeType.FieldDescriptionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
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
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const fieldNode = nodeByPath.get(change.path);
  if (fieldNode) {
    if (fieldNode.kind === Kind.FIELD_DEFINITION) {
      (fieldNode.description as StringValueNode | undefined) = undefined;
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind),
        config,
      );
    }
  } else {
    handleError(change, new ChangePathMissingError(change), config);
  }
}

export function fieldDescriptionChanged(
  change: Change<typeof ChangeType.FieldDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const fieldNode = getChangedNodeOfKind(change, nodeByPath, Kind.FIELD_DEFINITION, config);
  if (fieldNode) {
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
}
