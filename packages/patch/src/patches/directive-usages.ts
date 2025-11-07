import { ArgumentNode, ASTNode, DirectiveNode, Kind, parseValue, print, ValueNode } from 'graphql';
import { Change, ChangeType } from '@graphql-inspector/core';
import {
  AddedAttributeAlreadyExistsError,
  AddedAttributeCoordinateNotFoundError,
  AddedCoordinateAlreadyExistsError,
  ChangedAncestorCoordinateNotFoundError,
  ChangedCoordinateKindMismatchError,
  ChangedCoordinateNotFoundError,
  ChangePathMissingError,
  DeletedAncestorCoordinateNotFoundError,
  DeletedAttributeNotFoundError,
  ValueMismatchError,
} from '../errors.js';
import { nameNode } from '../node-templates.js';
import { PatchConfig, PatchContext, SchemaNode } from '../types.js';
import { findNamedNode, parentPath } from '../utils.js';

export type DirectiveUsageAddedChange =
  | typeof ChangeType.DirectiveUsageArgumentDefinitionAdded
  | typeof ChangeType.DirectiveUsageInputFieldDefinitionAdded
  | typeof ChangeType.DirectiveUsageInputObjectAdded
  | typeof ChangeType.DirectiveUsageInterfaceAdded
  | typeof ChangeType.DirectiveUsageObjectAdded
  | typeof ChangeType.DirectiveUsageEnumAdded
  | typeof ChangeType.DirectiveUsageFieldDefinitionAdded
  | typeof ChangeType.DirectiveUsageUnionMemberAdded
  | typeof ChangeType.DirectiveUsageEnumValueAdded
  | typeof ChangeType.DirectiveUsageSchemaAdded
  | typeof ChangeType.DirectiveUsageScalarAdded
  | typeof ChangeType.DirectiveUsageFieldAdded;

export type DirectiveUsageRemovedChange =
  | typeof ChangeType.DirectiveUsageArgumentDefinitionRemoved
  | typeof ChangeType.DirectiveUsageInputFieldDefinitionRemoved
  | typeof ChangeType.DirectiveUsageInputObjectRemoved
  | typeof ChangeType.DirectiveUsageInterfaceRemoved
  | typeof ChangeType.DirectiveUsageObjectRemoved
  | typeof ChangeType.DirectiveUsageEnumRemoved
  | typeof ChangeType.DirectiveUsageFieldDefinitionRemoved
  | typeof ChangeType.DirectiveUsageFieldRemoved
  | typeof ChangeType.DirectiveUsageUnionMemberRemoved
  | typeof ChangeType.DirectiveUsageEnumValueRemoved
  | typeof ChangeType.DirectiveUsageSchemaRemoved
  | typeof ChangeType.DirectiveUsageScalarRemoved;

/**
 * Tried to find the correct instance of the directive if it's repeated.
 * @note Should this should compare the arguments also to find the exact match if possible?
 */
function findNthDirective(directives: readonly DirectiveNode[], name: string, n: number) {
  let lastDirective: DirectiveNode | undefined;
  let count = 0;
  for (const d of directives) {
    // @note this nullish check is critical even though the types dont recognize it.
    if (d?.name.value === name) {
      lastDirective = d;
      count += 1;
      if (count === n) {
        break;
      }
    }
  }
  return lastDirective;
}

function directiveUsageDefinitionAdded(
  change: Change<DirectiveUsageAddedChange>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(
      new ChangedCoordinateNotFoundError(Kind.DIRECTIVE, change.meta.addedDirectiveName),
      change,
    );
    return;
  }

  const parentNode = nodeByPath.get(parentPath(change.path)) as
    | { kind: Kind; directives?: DirectiveNode[] }
    | undefined;
  if (!parentNode) {
    config.onError(
      new ChangedAncestorCoordinateNotFoundError(
        change.path,
        change.type,
        change.meta.addedDirectiveName,
      ),
      change,
    );
    return;
  }

  const definition = nodeByPath.get(`@${change.meta.addedDirectiveName}`);
  let repeatable = false;
  if (!definition) {
    console.warn(
      `Patch cannot determine the repeatability of directive "@${change.meta.addedDirectiveName}" because it's missing a definition.`,
    );
  }
  if (definition?.kind === Kind.DIRECTIVE_DEFINITION) {
    repeatable = definition.repeatable;
  }
  const directiveNode = findNthDirective(
    parentNode?.directives ?? [],
    change.meta.addedDirectiveName,
    change.meta.directiveRepeatedTimes,
  );
  if (!repeatable && directiveNode) {
    config.onError(new AddedCoordinateAlreadyExistsError(change.path, change.type), change);
    return;
  }

  const newDirective: DirectiveNode = {
    kind: Kind.DIRECTIVE,
    name: nameNode(change.meta.addedDirectiveName),
  };
  parentNode.directives = [...(parentNode.directives ?? []), newDirective];
}

function schemaDirectiveUsageDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageSchemaAdded>,
  schemaNodes: SchemaNode[],
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(
      new ChangedCoordinateNotFoundError(Kind.DIRECTIVE, change.meta.addedDirectiveName),
      change,
    );
    return;
  }
  const definition = nodeByPath.get(`@${change.meta.addedDirectiveName}`);
  let repeatable = false;
  if (!definition) {
    console.warn(`Directive "@${change.meta.addedDirectiveName}" is missing a definition.`);
  }
  if (definition?.kind === Kind.DIRECTIVE_DEFINITION) {
    repeatable = definition.repeatable;
  }

  const directiveAlreadyExists = schemaNodes.some(schemaNode =>
    findNthDirective(
      schemaNode.directives ?? [],
      change.meta.addedDirectiveName,
      change.meta.directiveRepeatedTimes,
    ),
  );
  if (!repeatable && directiveAlreadyExists) {
    config.onError(
      new AddedAttributeAlreadyExistsError(
        change.path,
        change.type,
        'directives',
        change.meta.addedDirectiveName,
      ),
      change,
    );
    return;
  }

  const directiveNode: DirectiveNode = {
    kind: Kind.DIRECTIVE,
    name: nameNode(change.meta.addedDirectiveName),
  };
  (schemaNodes[0].directives as DirectiveNode[] | undefined) = [
    ...(schemaNodes[0].directives ?? []),
    directiveNode,
  ];
}

function schemaDirectiveUsageDefinitionRemoved(
  change: Change<DirectiveUsageRemovedChange>,
  schemaNodes: SchemaNode[],
  _nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  let deleted = false;
  for (const node of schemaNodes) {
    const directiveNode = findNthDirective(
      node?.directives ?? [],
      change.meta.removedDirectiveName,
      change.meta.directiveRepeatedTimes,
    );
    if (directiveNode) {
      (node.directives as DirectiveNode[] | undefined) = node.directives?.filter(
        d => d.name.value !== change.meta.removedDirectiveName,
      );
      deleted = true;
      break;
    }
  }
  if (!deleted) {
    config.onError(
      new DeletedAttributeNotFoundError(
        change.path ?? '',
        change.type,
        'directives',
        change.meta.removedDirectiveName,
      ),
      change,
    );
  }
}

function directiveUsageDefinitionRemoved(
  change: Change<DirectiveUsageRemovedChange>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }

  const parentNode = nodeByPath.get(parentPath(change.path)) as
    | { kind: Kind; directives?: DirectiveNode[] }
    | undefined;
  if (!parentNode) {
    config.onError(
      new DeletedAncestorCoordinateNotFoundError(
        change.path,
        change.type,
        change.meta.removedDirectiveName,
      ),
      change,
    );
    return;
  }

  const directiveNode = findNthDirective(
    parentNode?.directives ?? [],
    change.meta.removedDirectiveName,
    change.meta.directiveRepeatedTimes,
  );
  if (!directiveNode) {
    config.onError(
      new DeletedAttributeNotFoundError(
        change.path,
        change.type,
        'directives',
        change.meta.removedDirectiveName,
      ),
      change,
    );
    return;
  }
  // null the value out for filtering later. The index is important so that changes reference
  // the correct DirectiveNode.
  // @note the nullish check is critical here even though the types dont show it
  const removedIndex = (parentNode.directives ?? []).findIndex(d => d === directiveNode);
  const directiveList = [...(parentNode.directives ?? [])];
  if (removedIndex !== -1) {
    (directiveList[removedIndex] as any) = undefined;
  }
  parentNode.directives = directiveList;
  context.removedDirectiveNodes.push(parentNode);
}

export function directiveUsageArgumentDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageArgumentDefinitionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageArgumentDefinitionRemoved(
  change: Change<typeof ChangeType.DirectiveUsageArgumentDefinitionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageEnumAdded(
  change: Change<typeof ChangeType.DirectiveUsageEnumAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageEnumRemoved(
  change: Change<typeof ChangeType.DirectiveUsageEnumRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageEnumValueAdded(
  change: Change<typeof ChangeType.DirectiveUsageEnumValueAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageEnumValueRemoved(
  change: Change<typeof ChangeType.DirectiveUsageEnumValueRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageFieldAdded(
  change: Change<typeof ChangeType.DirectiveUsageFieldAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageFieldDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageFieldDefinitionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageFieldDefinitionRemoved(
  change: Change<typeof ChangeType.DirectiveUsageFieldDefinitionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageFieldRemoved(
  change: Change<typeof ChangeType.DirectiveUsageFieldRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageInputFieldDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageInputFieldDefinitionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageInputFieldDefinitionRemoved(
  change: Change<typeof ChangeType.DirectiveUsageInputFieldDefinitionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageInputObjectAdded(
  change: Change<typeof ChangeType.DirectiveUsageInputObjectAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageInputObjectRemoved(
  change: Change<typeof ChangeType.DirectiveUsageInputObjectRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageInterfaceAdded(
  change: Change<typeof ChangeType.DirectiveUsageInterfaceAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageInterfaceRemoved(
  change: Change<typeof ChangeType.DirectiveUsageInterfaceRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageObjectAdded(
  change: Change<typeof ChangeType.DirectiveUsageObjectAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageObjectRemoved(
  change: Change<typeof ChangeType.DirectiveUsageObjectRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageScalarAdded(
  change: Change<typeof ChangeType.DirectiveUsageScalarAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageScalarRemoved(
  change: Change<typeof ChangeType.DirectiveUsageScalarRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageSchemaAdded(
  change: Change<typeof ChangeType.DirectiveUsageSchemaAdded>,
  schemaDefs: SchemaNode[],
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return schemaDirectiveUsageDefinitionAdded(change, schemaDefs, nodeByPath, config, context);
}

export function directiveUsageSchemaRemoved(
  change: Change<typeof ChangeType.DirectiveUsageSchemaRemoved>,
  schemaDefs: SchemaNode[],
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return schemaDirectiveUsageDefinitionRemoved(change, schemaDefs, nodeByPath, config, context);
}

export function directiveUsageUnionMemberAdded(
  change: Change<typeof ChangeType.DirectiveUsageUnionMemberAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config, context);
}

export function directiveUsageUnionMemberRemoved(
  change: Change<typeof ChangeType.DirectiveUsageUnionMemberRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  context: PatchContext,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config, context);
}

export function directiveUsageArgumentAdded(
  change: Change<typeof ChangeType.DirectiveUsageArgumentAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }
  // Must use double parentPath b/c the path is referencing the argument
  const parentNode = nodeByPath.get(parentPath(parentPath(change.path))) as
    | { kind: Kind; directives?: DirectiveNode[] }
    | undefined;
  const directiveNode = findNthDirective(
    parentNode?.directives ?? [],
    change.meta.directiveName,
    change.meta.directiveRepeatedTimes,
  );
  if (!directiveNode) {
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
  if (directiveNode.kind !== Kind.DIRECTIVE) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE, directiveNode.kind),
      change,
    );
    return;
  }

  const existing = findNamedNode(directiveNode.arguments, change.meta.addedArgumentName);
  // "ArgumentAdded" but argument already exists.
  if (existing) {
    config.onError(new ValueMismatchError(directiveNode.kind, null, print(existing.value)), change);
    (existing.value as ValueNode) = parseValue(change.meta.addedArgumentValue);
    return;
  }

  const argNode: ArgumentNode = {
    kind: Kind.ARGUMENT,
    name: nameNode(change.meta.addedArgumentName),
    value: parseValue(change.meta.addedArgumentValue),
  };
  (directiveNode.arguments as ArgumentNode[] | undefined) = [
    ...(directiveNode.arguments ?? []),
    argNode,
  ];
  nodeByPath.set(change.path, argNode);
}

export function directiveUsageArgumentRemoved(
  change: Change<typeof ChangeType.DirectiveUsageArgumentRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
  _context: PatchContext,
) {
  if (!change.path) {
    config.onError(new ChangePathMissingError(change), change);
    return;
  }
  // Must use double parentPath b/c the path is referencing the argument
  const parentNode = nodeByPath.get(parentPath(parentPath(change.path))) as
    | { kind: Kind; directives?: DirectiveNode[] }
    | undefined;

  const directiveNode = findNthDirective(
    parentNode?.directives ?? [],
    change.meta.directiveName,
    change.meta.directiveRepeatedTimes,
  );
  if (!directiveNode) {
    config.onError(
      new DeletedAncestorCoordinateNotFoundError(
        change.path,
        change.type,
        change.meta.removedArgumentName,
      ),
      change,
    );
    return;
  }
  if (directiveNode.kind !== Kind.DIRECTIVE) {
    config.onError(
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE, directiveNode.kind),
      change,
    );
    return;
  }

  const existing = findNamedNode(directiveNode.arguments, change.meta.removedArgumentName);
  if (!existing) {
    config.onError(
      new DeletedAttributeNotFoundError(
        change.path,
        change.type,
        'arguments',
        change.meta.removedArgumentName,
      ),
      change,
    );
  }

  (directiveNode.arguments as ArgumentNode[] | undefined) = (
    directiveNode.arguments as ArgumentNode[] | undefined
  )?.filter(a => a.name.value !== change.meta.removedArgumentName);
}
