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
  AddedAttributeAlreadyExistsError,
  AddedAttributeCoordinateNotFoundError,
  AddedCoordinateAlreadyExistsError,
  ChangedAncestorCoordinateNotFoundError,
  ChangedCoordinateKindMismatchError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedAttributeNotFoundError,
  handleError,
  ValueMismatchError,
} from '../errors.js';
import { nameNode, stringNode } from '../node-templates.js';
import { PatchConfig, PatchContext } from '../types.js';
import {
  deleteNamedNode,
  findNamedNode,
  getDeletedNodeOfKind,
  getDeletedParentNodeOfKind,
} from '../utils.js';

export function directiveAdded(
  change: Change<typeof ChangeType.DirectiveAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (change.path === undefined) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const changedNode = nodeByPath.get(change.path);
  if (changedNode) {
    handleError(
      change,
      new AddedCoordinateAlreadyExistsError(changedNode.kind, change.meta.addedDirectiveName),
      config,
    );
    return;
  }
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

export function directiveRemoved(
  change: Change<typeof ChangeType.DirectiveRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const existing = getDeletedNodeOfKind(change, nodeByPath, Kind.DIRECTIVE_DEFINITION, config);
  if (existing) {
    nodeByPath.delete(change.path!);
  }
}

export function directiveArgumentAdded(
  change: Change<typeof ChangeType.DirectiveArgumentAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  if (!directiveNode) {
    handleError(
      change,
      new AddedAttributeCoordinateNotFoundError(
        change.meta.directiveName,
        'arguments',
        change.meta.addedDirectiveArgumentName,
      ),
      config,
    );
    return;
  }
  if (directiveNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, directiveNode.kind),
      config,
    );
    return;
  }

  const existingArg = findNamedNode(
    directiveNode.arguments,
    change.meta.addedDirectiveArgumentName,
  );
  if (existingArg) {
    handleError(
      change,
      new AddedAttributeAlreadyExistsError(
        existingArg.kind,
        'arguments',
        change.meta.addedDirectiveArgumentName,
      ),
      config,
    );
    return;
  }

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

export function directiveArgumentRemoved(
  change: Change<typeof ChangeType.DirectiveArgumentRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  const argNode = getDeletedNodeOfKind(change, nodeByPath, Kind.INPUT_VALUE_DEFINITION, config);
  if (argNode) {
    const directiveNode = getDeletedParentNodeOfKind(
      change,
      nodeByPath,
      Kind.DIRECTIVE_DEFINITION,
      'arguments',
      config,
    );

    if (directiveNode) {
      (directiveNode.arguments as ReadonlyArray<InputValueDefinitionNode> | undefined) =
        deleteNamedNode(directiveNode.arguments, change.meta.removedDirectiveArgumentName);
    }
  }
}

export function directiveLocationAdded(
  change: Change<typeof ChangeType.DirectiveLocationAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const changedNode = nodeByPath.get(change.path);
  if (!changedNode) {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(Kind.DIRECTIVE_DEFINITION, 'locations'),
      config,
    );
    return;
  }

  if (changedNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, changedNode.kind),
      config,
    );
    return;
  }

  if (changedNode.locations.some(l => l.value === change.meta.addedDirectiveLocation)) {
    handleError(
      change,
      new AddedAttributeAlreadyExistsError(
        Kind.DIRECTIVE_DEFINITION,
        'locations',
        change.meta.addedDirectiveLocation,
      ),
      config,
    );
    return;
  }

  (changedNode.locations as NameNode[]) = [
    ...changedNode.locations,
    nameNode(change.meta.addedDirectiveLocation),
  ];
}

export function directiveLocationRemoved(
  change: Change<typeof ChangeType.DirectiveLocationRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const changedNode = nodeByPath.get(change.path);
  if (!changedNode) {
    handleError(
      change,
      new DeletedAncestorCoordinateNotFoundError(
        Kind.DIRECTIVE_DEFINITION,
        'locations',
        change.meta.removedDirectiveLocation,
      ),
      config,
    );
    return;
  }

  if (changedNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, changedNode.kind),
      config,
    );
    return;
  }

  const existing = changedNode.locations.findIndex(
    l => l.value === change.meta.removedDirectiveLocation,
  );
  if (existing >= 0) {
    (changedNode.locations as NameNode[]) = changedNode.locations.toSpliced(existing, 1);
  } else {
    handleError(
      change,
      new DeletedAttributeNotFoundError(
        changedNode.kind,
        'locations',
        change.meta.removedDirectiveLocation,
      ),
      config,
    );
  }
}

export function directiveDescriptionChanged(
  change: Change<typeof ChangeType.DirectiveDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  if (!directiveNode) {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(Kind.DIRECTIVE_DEFINITION, 'description'),
      config,
    );
    return;
  }
  if (directiveNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, directiveNode.kind),
      config,
    );
    return;
  }

  if (directiveNode.description?.value !== change.meta.oldDirectiveDescription) {
    handleError(
      change,
      new ValueMismatchError(
        Kind.STRING,
        change.meta.oldDirectiveDescription,
        directiveNode.description?.value,
      ),
      config,
    );
  }

  (directiveNode.description as StringValueNode | undefined) = change.meta.newDirectiveDescription
    ? stringNode(change.meta.newDirectiveDescription)
    : undefined;
}

export function directiveArgumentDefaultValueChanged(
  change: Change<typeof ChangeType.DirectiveArgumentDefaultValueChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const argumentNode = nodeByPath.get(change.path);
  if (!argumentNode) {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(Kind.ARGUMENT, 'defaultValue'),
      config,
    );
    return;
  }

  if (argumentNode.kind !== Kind.INPUT_VALUE_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, argumentNode.kind),
      config,
    );
    return;
  }

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
      new ValueMismatchError(
        Kind.INPUT_VALUE_DEFINITION,
        change.meta.oldDirectiveArgumentDefaultValue,
        argumentNode.defaultValue && print(argumentNode.defaultValue),
      ),
      config,
    );
  }
}

export function directiveArgumentDescriptionChanged(
  change: Change<typeof ChangeType.DirectiveArgumentDescriptionChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const argumentNode = nodeByPath.get(change.path);
  if (!argumentNode) {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(Kind.INPUT_VALUE_DEFINITION, 'description'),
      config,
    );
    return;
  }

  if (argumentNode.kind !== Kind.INPUT_VALUE_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, argumentNode.kind),
      config,
    );
    return;
  }

  if ((argumentNode.description?.value ?? null) !== change.meta.oldDirectiveArgumentDescription) {
    handleError(
      change,
      new ValueMismatchError(
        Kind.STRING,
        change.meta.oldDirectiveArgumentDescription ?? undefined,
        argumentNode.description?.value,
      ),
      config,
    );
  }
  (argumentNode.description as StringValueNode | undefined) = change.meta
    .newDirectiveArgumentDescription
    ? stringNode(change.meta.newDirectiveArgumentDescription)
    : undefined;
}

export function directiveArgumentTypeChanged(
  change: Change<typeof ChangeType.DirectiveArgumentTypeChanged>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const argumentNode = nodeByPath.get(change.path);
  if (!argumentNode) {
    handleError(change, new ChangedAncestorCoordinateNotFoundError(Kind.ARGUMENT, 'type'), config);
    return;
  }
  if (argumentNode.kind !== Kind.INPUT_VALUE_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, argumentNode.kind),
      config,
    );
    return;
  }

  if (print(argumentNode.type) !== change.meta.oldDirectiveArgumentType) {
    handleError(
      change,
      new ValueMismatchError(
        Kind.STRING,
        change.meta.oldDirectiveArgumentType,
        print(argumentNode.type),
      ),
      config,
    );
  }
  (argumentNode.type as TypeNode | undefined) = parseType(change.meta.newDirectiveArgumentType);
}

export function directiveRepeatableAdded(
  change: Change<typeof ChangeType.DirectiveRepeatableAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  if (!directiveNode) {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(Kind.DIRECTIVE_DEFINITION, 'description'),
      config,
    );
    return;
  }
  if (directiveNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, directiveNode.kind),
      config,
    );
    return;
  }

  if (directiveNode.repeatable !== false) {
    handleError(
      change,
      new ValueMismatchError(Kind.BOOLEAN, String(directiveNode.repeatable), 'false'),
      config,
    );
  }

  (directiveNode.repeatable as boolean) = true;
}

export function directiveRepeatableRemoved(
  change: Change<typeof ChangeType.DirectiveRepeatableRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  if (!directiveNode) {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(Kind.DIRECTIVE_DEFINITION, 'description'),
      config,
    );
    return;
  }

  if (directiveNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, directiveNode.kind),
      config,
    );
    return;
  }

  if (directiveNode.repeatable !== true) {
    handleError(
      change,
      new ValueMismatchError(Kind.BOOLEAN, String(directiveNode.repeatable), 'true'),
      config,
    );
  }

  (directiveNode.repeatable as boolean) = false;
}
