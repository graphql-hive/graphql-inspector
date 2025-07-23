import {
  ArgumentNode,
  ASTNode,
  DirectiveNode,
  FieldDefinitionNode,
  GraphQLDeprecatedDirective,
  InputValueDefinitionNode,
  Kind,
  parseType,
  print,
  StringValueNode,
  TypeNode,
} from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  CoordinateAlreadyExistsError,
  CoordinateNotFoundError,
  DeprecatedDirectiveNotFound,
  DeprecationReasonAlreadyExists,
  DescriptionMismatchError,
  DirectiveAlreadyExists,
  FieldTypeMismatchError,
  handleError,
  KindMismatchError,
  OldValueMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import type { PatchConfig } from '../types';
import { getDeprecatedDirectiveNode, parentPath } from '../utils.js';

export function fieldTypeChanged(
  change: Change<typeof ChangeType.FieldTypeChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const c = change as Change<typeof ChangeType.FieldTypeChanged>;
  const node = nodeByPath.get(c.path!);
  if (node) {
    if (node.kind === Kind.FIELD_DEFINITION) {
      const currentReturnType = print(node.type);
      if (c.meta.oldFieldType === currentReturnType) {
        (node.type as TypeNode) = parseType(c.meta.newFieldType);
      } else {
        handleError(c, new FieldTypeMismatchError(c.meta.oldFieldType, currentReturnType), config);
      }
    } else {
      handleError(c, new KindMismatchError(Kind.FIELD_DEFINITION, node.kind), config);
    }
  } else {
    handleError(c, new CoordinateNotFoundError(), config);
  }
}

export function fieldRemoved(
  removal: Change<typeof ChangeType.FieldRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = removal.path!;
  const typeNode = nodeByPath.get(parentPath(changedPath)) as
    | (ASTNode & { fields?: FieldDefinitionNode[] })
    | undefined;
  if (!typeNode || !typeNode.fields?.length) {
    handleError(removal, new CoordinateNotFoundError(), config);
  } else {
    const beforeLength = typeNode.fields.length;
    typeNode.fields = typeNode.fields.filter(f => f.name.value !== removal.meta.removedFieldName);
    if (beforeLength === typeNode.fields.length) {
      handleError(removal, new CoordinateNotFoundError(), config);
    } else {
      // delete the reference to the removed field.
      nodeByPath.delete(changedPath);
    }
  }
}

export function fieldAdded(
  change: Change<typeof ChangeType.FieldAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const changedNode = nodeByPath.get(changedPath);
  if (changedNode) {
    handleError(change, new CoordinateAlreadyExistsError(changedNode.kind), config);
  } else {
    const typeNode = nodeByPath.get(parentPath(changedPath)) as ASTNode & {
      fields?: FieldDefinitionNode[];
    };
    if (!typeNode) {
      handleError(change, new CoordinateNotFoundError(), config);
    } else if (
      typeNode.kind !== Kind.OBJECT_TYPE_DEFINITION &&
      typeNode.kind !== Kind.INTERFACE_TYPE_DEFINITION
    ) {
      handleError(change, new KindMismatchError(Kind.ENUM_TYPE_DEFINITION, typeNode.kind), config);
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
      nodeByPath.set(changedPath, node);
    }
  }
}

export function fieldArgumentAdded(
  change: Change<typeof ChangeType.FieldArgumentAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const existing = nodeByPath.get(changedPath);
  if (existing) {
    handleError(change, new CoordinateAlreadyExistsError(existing.kind), config);
  } else {
    const fieldNode = nodeByPath.get(parentPath(changedPath)) as ASTNode & {
      arguments?: InputValueDefinitionNode[];
    };
    if (!fieldNode) {
      handleError(change, new CoordinateNotFoundError(), config);
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
      nodeByPath.set(changedPath, node);
    } else {
      handleError(change, new KindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind), config);
    }
  }
}

export function fieldDeprecationReasonChanged(
  change: Change<typeof ChangeType.FieldDeprecationReasonChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const deprecationNode = nodeByPath.get(changedPath);
  if (deprecationNode) {
    if (deprecationNode.kind === Kind.DIRECTIVE) {
      const reasonArgument = deprecationNode.arguments?.find(a => a.name.value === 'reason');
      if (reasonArgument) {
        if (print(reasonArgument.value) === change.meta.oldDeprecationReason) {
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
          handleError(
            change,
            new OldValueMismatchError(
              print(reasonArgument.value),
              change.meta.oldDeprecationReason,
            ),
            config,
          );
        }
      } else {
        handleError(change, new CoordinateNotFoundError(), config);
      }
    } else {
      handleError(change, new KindMismatchError(Kind.DIRECTIVE, deprecationNode.kind), config);
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}

export function fieldDeprecationReasonAdded(
  change: Change<typeof ChangeType.FieldDeprecationReasonAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const deprecationNode = nodeByPath.get(changedPath);
  if (deprecationNode) {
    if (deprecationNode.kind === Kind.DIRECTIVE) {
      const reasonArgument = deprecationNode.arguments?.find(a => a.name.value === 'reason');
      if (reasonArgument) {
        handleError(
          change,
          new DeprecationReasonAlreadyExists((reasonArgument.value as StringValueNode)?.value),
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
        nodeByPath.set(`${changedPath}.reason`, node);
      }
    } else {
      handleError(change, new KindMismatchError(Kind.DIRECTIVE, deprecationNode.kind), config);
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}

export function fieldDeprecationAdded(
  change: Change<typeof ChangeType.FieldDeprecationAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const fieldNode = nodeByPath.get(changedPath);
  if (fieldNode) {
    if (fieldNode.kind === Kind.FIELD_DEFINITION) {
      const hasExistingDeprecationDirective = getDeprecatedDirectiveNode(fieldNode);
      if (hasExistingDeprecationDirective) {
        handleError(change, new DirectiveAlreadyExists(GraphQLDeprecatedDirective.name), config);
      } else {
        const directiveNode = {
          kind: Kind.DIRECTIVE,
          name: nameNode(GraphQLDeprecatedDirective.name),
          ...(change.meta.deprecationReason
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
        nodeByPath.set(`${changedPath}.${GraphQLDeprecatedDirective.name}`, directiveNode);
      }
    } else {
      handleError(change, new KindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind), config);
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}

export function fieldDeprecationRemoved(
  change: Change<typeof ChangeType.FieldDeprecationRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const fieldNode = nodeByPath.get(changedPath);
  if (fieldNode) {
    if (fieldNode.kind === Kind.FIELD_DEFINITION) {
      const hasExistingDeprecationDirective = getDeprecatedDirectiveNode(fieldNode);
      if (hasExistingDeprecationDirective) {
        (fieldNode.directives as DirectiveNode[] | undefined) = fieldNode.directives?.filter(
          d => d.name.value !== GraphQLDeprecatedDirective.name,
        );
        nodeByPath.delete(`${changedPath}.${GraphQLDeprecatedDirective.name}`);
      } else {
        handleError(change, new DeprecatedDirectiveNotFound(), config);
      }
    } else {
      handleError(change, new KindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind), config);
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}

export function fieldDescriptionAdded(
  change: Change<typeof ChangeType.FieldDescriptionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const fieldNode = nodeByPath.get(changedPath);
  if (fieldNode) {
    if (fieldNode.kind === Kind.FIELD_DEFINITION) {
      (fieldNode.description as StringValueNode | undefined) = change.meta.addedDescription
        ? stringNode(change.meta.addedDescription)
        : undefined;
    } else {
      handleError(change, new KindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind), config);
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}

export function fieldDescriptionRemoved(
  change: Change<typeof ChangeType.FieldDescriptionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const fieldNode = nodeByPath.get(changedPath);
  if (fieldNode) {
    if (fieldNode.kind === Kind.FIELD_DEFINITION) {
      (fieldNode.description as StringValueNode | undefined) = undefined;
    } else {
      handleError(change, new KindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind), config);
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}

export function fieldDescriptionChanged(
  change: Change<typeof ChangeType.FieldDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const changedPath = change.path!;
  const fieldNode = nodeByPath.get(changedPath);
  if (fieldNode) {
    if (fieldNode.kind === Kind.FIELD_DEFINITION) {
      if (fieldNode.description?.value === change.meta.oldDescription) {
        (fieldNode.description as StringValueNode | undefined) = stringNode(
          change.meta.newDescription,
        );
      } else {
        handleError(
          change,
          new DescriptionMismatchError(change.meta.oldDescription, fieldNode.description?.value),
          config,
        );
      }
    } else {
      handleError(change, new KindMismatchError(Kind.FIELD_DEFINITION, fieldNode.kind), config);
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}
