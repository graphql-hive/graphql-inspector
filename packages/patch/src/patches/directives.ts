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
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const changedNode = nodeByPath.get(change.path);

  if (!changedNode) {
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
    return;
  }

  if (changedNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, changedNode.kind),
      change,
    );
    return;
  }

  // eslint-disable-next-line eqeqeq
  if (change.meta.addedDirectiveRepeatable != changedNode.repeatable) {
    config.onError(
      new ValueMismatchError(
        changedNode.kind,
        `repeatable=${change.meta.addedDirectiveRepeatable}`,
        `repeatable=${changedNode.repeatable}`,
      ),
      change,
    );
    return;
  }

  if (
    change.meta.addedDirectiveLocations.join('|') !==
    changedNode.locations.map(l => l.value).join('|')
  ) {
    config.onError(
      new ValueMismatchError(
        changedNode.kind,
        `locations=${change.meta.addedDirectiveLocations.join('|')}`,
        `locations=${changedNode.locations.map(l => l.value).join('|')}`,
      ),
      change,
    );
    return;
  }

  config.onError(
    new AddedCoordinateAlreadyExistsError(changedNode.kind, change.meta.addedDirectiveName),
    change,
  );
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
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  if (!directiveNode) {
    config.onError(
      new AddedAttributeCoordinateNotFoundError(
        change.meta.directiveName,
        'arguments',
        change.meta.addedDirectiveArgumentName,
      ),
      change,
    );
    return;
  }
  if (directiveNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, directiveNode.kind),
      change,
    );
    return;
  }

  const existingArg = findNamedNode(
    directiveNode.arguments,
    change.meta.addedDirectiveArgumentName,
  );
  if (!existingArg) {
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
    return;
  }

  const existingType = print(existingArg.type);
  if (existingType !== change.meta.addedDirectiveArgumentType) {
    config.onError(
      new ValueMismatchError(
        existingArg.kind,
        `type=${change.meta.addedDirectiveArgumentType}`,
        `type=${existingType}`,
      ),
      change,
    );
  }

  const existingDefaultValue = existingArg.defaultValue
    ? print(existingArg.defaultValue)
    : undefined;
  if (change.meta.addedDirectiveDefaultValue !== existingDefaultValue) {
    config.onError(
      new ValueMismatchError(
        existingArg.kind,
        `defaultValue=${change.meta.addedDirectiveDefaultValue}`,
        `defaultValue=${existingDefaultValue}`,
      ),
      change,
    );
  }

  config.onError(
    new AddedAttributeAlreadyExistsError(
      existingArg.kind,
      'arguments',
      change.meta.addedDirectiveArgumentName,
    ),
    change,
  );
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
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const changedNode = nodeByPath.get(change.path);
  if (!changedNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(Kind.DIRECTIVE_DEFINITION, 'locations'),
      change,
    );
    return;
  }

  if (changedNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, changedNode.kind),
      change,
    );
    return;
  }

  if (changedNode.locations.some(l => l.value === change.meta.addedDirectiveLocation)) {
    config.onError(
      new AddedAttributeAlreadyExistsError(
        Kind.DIRECTIVE_DEFINITION,
        'locations',
        change.meta.addedDirectiveLocation,
      ),
      change,
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
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const changedNode = nodeByPath.get(change.path);
  if (!changedNode) {
    config.onError(
      new DeletedAncestorCoordinateNotFoundError(
        Kind.DIRECTIVE_DEFINITION,
        'locations',
        change.meta.removedDirectiveLocation,
      ),
      change,
    );
    return;
  }

  if (changedNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, changedNode.kind),
      change,
    );
    return;
  }

  const existing = changedNode.locations.findIndex(
    l => l.value === change.meta.removedDirectiveLocation,
  );
  if (existing >= 0) {
    (changedNode.locations as NameNode[]) = changedNode.locations.toSpliced(existing, 1);
  } else {
    config.onError(
      new DeletedAttributeNotFoundError(
        changedNode.kind,
        'locations',
        change.meta.removedDirectiveLocation,
      ),
      change,
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
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  if (!directiveNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(Kind.DIRECTIVE_DEFINITION, 'description'),
      change,
    );
    return;
  }
  if (directiveNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, directiveNode.kind),
      change,
    );
    return;
  }

  if ((directiveNode.description?.value ?? null) !== change.meta.oldDirectiveDescription) {
    config.onError(
      new ValueMismatchError(
        Kind.STRING,
        change.meta.oldDirectiveDescription,
        directiveNode.description?.value,
      ),
      change,
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
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const argumentNode = nodeByPath.get(change.path);
  if (!argumentNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(Kind.ARGUMENT, 'defaultValue'),
      change,
    );
    return;
  }

  if (argumentNode.kind !== Kind.INPUT_VALUE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, argumentNode.kind),
      change,
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
    config.onError(
      new ValueMismatchError(
        Kind.INPUT_VALUE_DEFINITION,
        change.meta.oldDirectiveArgumentDefaultValue,
        argumentNode.defaultValue && print(argumentNode.defaultValue),
      ),
      change,
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
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const argumentNode = nodeByPath.get(change.path);
  if (!argumentNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(Kind.INPUT_VALUE_DEFINITION, 'description'),
      change,
    );
    return;
  }

  if (argumentNode.kind !== Kind.INPUT_VALUE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, argumentNode.kind),
      change,
    );
    return;
  }

  if ((argumentNode.description?.value ?? null) !== change.meta.oldDirectiveArgumentDescription) {
    config.onError(
      new ValueMismatchError(
        Kind.STRING,
        change.meta.oldDirectiveArgumentDescription ?? undefined,
        argumentNode.description?.value,
      ),
      change,
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
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const argumentNode = nodeByPath.get(change.path);
  if (!argumentNode) {
    config.onError(new ChangedAncestorCoordinateNotFoundError(Kind.ARGUMENT, 'type'), change);
    return;
  }
  if (argumentNode.kind !== Kind.INPUT_VALUE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.INPUT_VALUE_DEFINITION, argumentNode.kind),
      change,
    );
    return;
  }

  if (print(argumentNode.type) !== change.meta.oldDirectiveArgumentType) {
    config.onError(
      new ValueMismatchError(
        Kind.STRING,
        change.meta.oldDirectiveArgumentType,
        print(argumentNode.type),
      ),
      change,
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
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  if (!directiveNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(Kind.DIRECTIVE_DEFINITION, 'description'),
      change,
    );
    return;
  }
  if (directiveNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, directiveNode.kind),
      change,
    );
    return;
  }

  if (directiveNode.repeatable !== false) {
    config.onError(
      new ValueMismatchError(Kind.BOOLEAN, String(directiveNode.repeatable), 'false'),
      change,
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
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const directiveNode = nodeByPath.get(change.path);
  if (!directiveNode) {
    config.onError(
      new DeletedAncestorCoordinateNotFoundError(Kind.DIRECTIVE_DEFINITION, 'repeatable', 'true'),
      change,
    );
    return;
  }

  if (directiveNode.kind !== Kind.DIRECTIVE_DEFINITION) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE_DEFINITION, directiveNode.kind),
      change,
    );
    return;
  }

  if (directiveNode.repeatable !== true) {
    config.onError(
      new ValueMismatchError(Kind.BOOLEAN, String(directiveNode.repeatable), 'true'),
      change,
    );
  }

  (directiveNode.repeatable as boolean) = false;
}
