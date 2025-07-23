import {
  ASTNode,
  DirectiveDefinitionNode,
  InputValueDefinitionNode,
  Kind,
  NameNode,
  parseConstValue,
  parseType,
  print,
  StringValueNode,
  TypeNode,
  ValueNode,
} from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  ArgumentDefaultValueMismatchError,
  ArgumentDescriptionMismatchError,
  CoordinateAlreadyExistsError,
  CoordinateNotFoundError,
  DirectiveLocationAlreadyExistsError,
  handleError,
  KindMismatchError,
  OldTypeMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import { PatchConfig } from '../types.js';

export function directiveAdded(
  change: Change<typeof ChangeType.DirectiveAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (change.path === undefined) {
    handleError(change, new CoordinateNotFoundError(), config);
    return;
  }

  const changedNode = nodeByPath.get(change.path);
  if (changedNode) {
    handleError(change, new CoordinateAlreadyExistsError(changedNode.kind), config);
  } else {
    const node: DirectiveDefinitionNode = {
      kind: Kind.DIRECTIVE_DEFINITION,
      name: nameNode(change.meta.addedDirectiveName),
      repeatable: change.meta.addedDirectiveRepeatable,
      locations: change.meta.addedDirectiveLocations.map(l => nameNode(l)),
      description: change.meta.addedDirectiveDescription
        ? stringNode(change.meta.addedDirectiveDescription)
        : undefined,
    };
    nodeByPath.set(change.path, node);
  }
}

export function directiveArgumentAdded(
  change: Change<typeof ChangeType.DirectiveArgumentAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new CoordinateNotFoundError(), config);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  if (!directiveNode) {
    handleError(change, new CoordinateNotFoundError(), config);
  } else if (directiveNode.kind === Kind.DIRECTIVE_DEFINITION) {
    const existingArg = directiveNode.arguments?.find(
      d => d.name.value === change.meta.addedDirectiveArgumentName,
    );
    if (existingArg) {
      // @todo make sure to check that everything is equal to the change, else error
      // because it conflicts.
      // if (print(existingArg.type) === change.meta.addedDirectiveArgumentType) {
      //   // warn
      //   // handleError(change, new ArgumentAlreadyExistsError(), config);
      // } else {
      //   // error
      // }
    } else {
      const node: InputValueDefinitionNode = {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: nameNode(change.meta.addedDirectiveArgumentName),
        type: parseType(change.meta.addedDirectiveArgumentType),
      };
      (directiveNode.arguments as InputValueDefinitionNode[] | undefined) = [
        ...(directiveNode.arguments ?? []),
        node,
      ];
      nodeByPath.set(`${change.path}.${change.meta.addedDirectiveArgumentName}`, node);
    }
  } else {
    handleError(
      change,
      new KindMismatchError(Kind.DIRECTIVE_DEFINITION, directiveNode.kind),
      config,
    );
  }
}

export function directiveLocationAdded(
  change: Change<typeof ChangeType.DirectiveLocationAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new CoordinateNotFoundError(), config);
    return;
  }

  const changedNode = nodeByPath.get(change.path);
  if (changedNode) {
    if (changedNode.kind === Kind.DIRECTIVE_DEFINITION) {
      if (changedNode.locations.some(l => l.value === change.meta.addedDirectiveLocation)) {
        handleError(
          change,
          new DirectiveLocationAlreadyExistsError(
            change.meta.directiveName,
            change.meta.addedDirectiveLocation,
          ),
          config,
        );
      } else {
        (changedNode.locations as NameNode[]) = [
          ...changedNode.locations,
          nameNode(change.meta.addedDirectiveLocation),
        ];
      }
    } else {
      handleError(
        change,
        new KindMismatchError(Kind.DIRECTIVE_DEFINITION, changedNode.kind),
        config,
      );
    }
  } else {
    handleError(change, new CoordinateNotFoundError(), config);
  }
}

export function directiveDescriptionChanged(
  change: Change<typeof ChangeType.DirectiveDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new CoordinateNotFoundError(), config);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  if (!directiveNode) {
    handleError(change, new CoordinateNotFoundError(), config);
  } else if (directiveNode.kind === Kind.DIRECTIVE_DEFINITION) {
    // eslint-disable-next-line eqeqeq
    if (directiveNode.description?.value == change.meta.oldDirectiveDescription) {
      (directiveNode.description as StringValueNode | undefined) = change.meta
        .newDirectiveDescription
        ? stringNode(change.meta.newDirectiveDescription)
        : undefined;
    } else {
      handleError(
        change,
        new ArgumentDescriptionMismatchError(
          change.meta.oldDirectiveDescription,
          directiveNode.description?.value,
        ),
        config,
      );
    }
  } else {
    handleError(
      change,
      new KindMismatchError(Kind.DIRECTIVE_DEFINITION, directiveNode.kind),
      config,
    );
  }
}

export function directiveArgumentDefaultValueChanged(
  change: Change<typeof ChangeType.DirectiveArgumentDefaultValueChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new CoordinateNotFoundError(), config);
    return;
  }

  const argumentNode = nodeByPath.get(change.path);
  if (!argumentNode) {
    handleError(change, new CoordinateNotFoundError(), config);
  } else if (argumentNode.kind === Kind.INPUT_VALUE_DEFINITION) {
    if (
      (argumentNode.defaultValue && print(argumentNode.defaultValue)) ===
      change.meta.oldDirectiveArgumentDefaultValue
    ) {
      (argumentNode.defaultValue as ValueNode | undefined) = change.meta
        .newDirectiveArgumentDefaultValue
        ? parseConstValue(change.meta.newDirectiveArgumentDefaultValue)
        : undefined;
    } else {
      handleError(
        change,
        new ArgumentDefaultValueMismatchError(
          change.meta.oldDirectiveArgumentDefaultValue,
          argumentNode.defaultValue && print(argumentNode.defaultValue),
        ),
        config,
      );
    }
  } else {
    handleError(
      change,
      new KindMismatchError(Kind.INPUT_VALUE_DEFINITION, argumentNode.kind),
      config,
    );
  }
}

export function directiveArgumentDescriptionChanged(
  change: Change<typeof ChangeType.DirectiveArgumentDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new CoordinateNotFoundError(), config);
    return;
  }

  const argumentNode = nodeByPath.get(change.path);
  if (!argumentNode) {
    handleError(change, new CoordinateNotFoundError(), config);
  } else if (argumentNode.kind === Kind.INPUT_VALUE_DEFINITION) {
    // eslint-disable-next-line eqeqeq
    if (argumentNode.description?.value == change.meta.oldDirectiveArgumentDescription) {
      (argumentNode.description as StringValueNode | undefined) = change.meta
        .newDirectiveArgumentDescription
        ? stringNode(change.meta.newDirectiveArgumentDescription)
        : undefined;
    } else {
      handleError(
        change,
        new ArgumentDescriptionMismatchError(
          change.meta.oldDirectiveArgumentDescription,
          argumentNode.description?.value,
        ),
        config,
      );
    }
  } else {
    handleError(
      change,
      new KindMismatchError(Kind.INPUT_VALUE_DEFINITION, argumentNode.kind),
      config,
    );
  }
}

export function directiveArgumentTypeChanged(
  change: Change<typeof ChangeType.DirectiveArgumentTypeChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new CoordinateNotFoundError(), config);
    return;
  }

  const argumentNode = nodeByPath.get(change.path);
  if (!argumentNode) {
    handleError(change, new CoordinateNotFoundError(), config);
  } else if (argumentNode.kind === Kind.INPUT_VALUE_DEFINITION) {
    if (print(argumentNode.type) === change.meta.oldDirectiveArgumentType) {
      (argumentNode.type as TypeNode | undefined) = parseType(change.meta.newDirectiveArgumentType);
    } else {
      handleError(
        change,
        new OldTypeMismatchError(change.meta.oldDirectiveArgumentType, print(argumentNode.type)),
        config,
      );
    }
  } else {
    handleError(
      change,
      new KindMismatchError(Kind.INPUT_VALUE_DEFINITION, argumentNode.kind),
      config,
    );
  }
}
