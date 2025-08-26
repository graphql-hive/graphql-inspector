import {
  ArgumentNode,
  ASTNode,
  DirectiveNode,
  EnumValueDefinitionNode,
  Kind,
  print,
  StringValueNode,
} from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  AddedAttributeAlreadyExistsError,
  AddedAttributeCoordinateNotFoundError,
  AddedCoordinateAlreadyExistsError,
  ChangedAncestorCoordinateNotFoundError,
  ChangedCoordinateKindMismatchError,
  ChangedCoordinateNotFoundError,
  ChangePathMissingError,
  DeletedAttributeNotFoundError,
  DeletedCoordinateNotFound,
  handleError,
  ValueMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import type { PatchConfig } from '../types';
import { findNamedNode, parentPath } from '../utils.js';

export function enumValueRemoved(
  change: Change<typeof ChangeType.EnumValueRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const enumNode = nodeByPath.get(parentPath(change.path)) as
    | (ASTNode & { values?: EnumValueDefinitionNode[] })
    | undefined;
  if (!enumNode) {
    handleError(
      change,
      new DeletedCoordinateNotFound(Kind.ENUM_TYPE_DEFINITION, change.meta.removedEnumValueName),
      config,
    );
  } else if (enumNode.kind !== Kind.ENUM_TYPE_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.ENUM_TYPE_DEFINITION, enumNode.kind),
      config,
    );
  } else if (enumNode.values === undefined || enumNode.values.length === 0) {
    handleError(
      change,
      new DeletedAttributeNotFoundError(
        Kind.ENUM_TYPE_DEFINITION,
        'values',
        change.meta.removedEnumValueName,
      ),
      config,
    );
  } else {
    const beforeLength = enumNode.values.length;
    enumNode.values = enumNode.values.filter(
      f => f.name.value !== change.meta.removedEnumValueName,
    );
    if (beforeLength === enumNode.values.length) {
      handleError(
        change,
        new DeletedAttributeNotFoundError(
          Kind.ENUM_TYPE_DEFINITION,
          'values',
          change.meta.removedEnumValueName,
        ),
        config,
      );
    } else {
      // delete the reference to the removed field.
      nodeByPath.delete(change.path);
    }
  }
}

export function enumValueAdded(
  change: Change<typeof ChangeType.EnumValueAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  const enumValuePath = change.path!;
  const enumNode = nodeByPath.get(parentPath(enumValuePath)) as
    | (ASTNode & { values: EnumValueDefinitionNode[] })
    | undefined;
  const changedNode = nodeByPath.get(enumValuePath);
  if (!enumNode) {
    handleError(change, new ChangedAncestorCoordinateNotFoundError(Kind.ENUM, 'values'), config);
  } else if (changedNode) {
    handleError(
      change,
      new AddedAttributeAlreadyExistsError(
        changedNode.kind,
        'values',
        change.meta.addedEnumValueName,
      ),
      config,
    );
  } else if (enumNode.kind === Kind.ENUM_TYPE_DEFINITION) {
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
  } else {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.ENUM_TYPE_DEFINITION, enumNode.kind),
      config,
    );
  }
}

export function enumValueDeprecationReasonAdded(
  change: Change<typeof ChangeType.EnumValueDeprecationReasonAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const enumValueNode = nodeByPath.get(parentPath(change.path));
  const deprecation = nodeByPath.get(change.path) as DirectiveNode | undefined;
  if (enumValueNode) {
    if (enumValueNode.kind === Kind.ENUM_VALUE_DEFINITION) {
      if (deprecation) {
        if (findNamedNode(deprecation.arguments, 'reason')) {
          handleError(
            change,
            new AddedCoordinateAlreadyExistsError(Kind.ENUM_VALUE_DEFINITION, 'reason'),
            config,
          );
        }
        const argNode: ArgumentNode = {
          kind: Kind.ARGUMENT,
          name: nameNode('reason'),
          value: stringNode(change.meta.addedValueDeprecationReason),
        };
        (deprecation.arguments as ArgumentNode[] | undefined) = [
          ...(deprecation.arguments ?? []),
          argNode,
        ];
        nodeByPath.set(`${change.path}.reason`, argNode);
      } else {
        handleError(change, new ChangePathMissingError(change), config);
      }
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.ENUM_VALUE_DEFINITION, enumValueNode.kind),
        config,
      );
    }
  } else {
    handleError(
      change,
      new AddedAttributeCoordinateNotFoundError(
        change.meta.enumValueName,
        'directives',
        '@deprecated',
      ),
      config,
    );
  }
}

export function enumValueDeprecationReasonChanged(
  change: Change<typeof ChangeType.EnumValueDeprecationReasonChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const deprecatedNode = nodeByPath.get(change.path);
  if (deprecatedNode) {
    if (deprecatedNode.kind === Kind.DIRECTIVE) {
      const reasonArgNode = findNamedNode(deprecatedNode.arguments, 'reason');
      if (reasonArgNode) {
        if (reasonArgNode.kind === Kind.ARGUMENT) {
          const oldValueMatches =
            reasonArgNode.value &&
            print(reasonArgNode.value) === change.meta.oldEnumValueDeprecationReason;

          if (!oldValueMatches) {
            handleError(
              change,
              new ValueMismatchError(
                Kind.ARGUMENT,
                change.meta.oldEnumValueDeprecationReason,
                reasonArgNode.value && print(reasonArgNode.value),
              ),
              config,
            );
          }
          (reasonArgNode.value as StringValueNode | undefined) = stringNode(
            change.meta.newEnumValueDeprecationReason,
          );
        } else {
          handleError(
            change,
            new ChangedCoordinateKindMismatchError(Kind.ARGUMENT, reasonArgNode.kind),
            config,
          );
        }
      } else {
        handleError(change, new ChangedCoordinateNotFoundError(Kind.ARGUMENT, 'reason'), config);
      }
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE, deprecatedNode.kind),
        config,
      );
    }
  } else {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(Kind.DIRECTIVE, 'arguments'),
      config,
    );
  }
}

export function enumValueDescriptionChanged(
  change: Change<typeof ChangeType.EnumValueDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const enumValueNode = nodeByPath.get(change.path);
  if (enumValueNode) {
    if (enumValueNode.kind === Kind.ENUM_VALUE_DEFINITION) {
      // eslint-disable-next-line eqeqeq
      const oldValueMatches =
        change.meta.oldEnumValueDescription == enumValueNode.description?.value;
      if (!oldValueMatches) {
        handleError(
          change,
          new ValueMismatchError(
            Kind.ENUM_TYPE_DEFINITION,
            change.meta.oldEnumValueDescription,
            enumValueNode.description?.value,
          ),
          config,
        );
      }
      (enumValueNode.description as StringValueNode | undefined) = change.meta
        .newEnumValueDescription
        ? stringNode(change.meta.newEnumValueDescription)
        : undefined;
    } else {
      handleError(
        change,
        new ChangedCoordinateKindMismatchError(Kind.ENUM_VALUE_DEFINITION, enumValueNode.kind),
        config,
      );
    }
  } else {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(Kind.ENUM_VALUE_DEFINITION, 'values'),
      config,
    );
  }
}
