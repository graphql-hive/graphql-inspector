/* eslint-disable unicorn/no-negated-condition */
import { ArgumentNode, ASTNode, DirectiveNode, Kind, parseValue } from 'graphql';
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
  handleError,
} from '../errors.js';
import { nameNode } from '../node-templates.js';
import { PatchConfig, SchemaNode } from '../types.js';
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
    if (d.name.value === name) {
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
) {
  if (!change.path) {
    handleError(
      change,
      new ChangedCoordinateNotFoundError(Kind.DIRECTIVE, change.meta.addedDirectiveName),
      config,
    );
    return;
  }

  const parentNode = nodeByPath.get(parentPath(change.path)) as
    | { kind: Kind; directives?: DirectiveNode[] }
    | undefined;
  if (
    change.meta.addedDirectiveName === 'deprecated' &&
    parentNode &&
    (parentNode.kind === Kind.FIELD_DEFINITION || parentNode.kind === Kind.ENUM_VALUE_DEFINITION)
  ) {
    return; // ignore because deprecated is handled by its own change... consider adjusting this.
  }
  const definition = nodeByPath.get(`@${change.meta.addedDirectiveName}`);
  let repeatable = false;
  if (!definition) {
    console.warn(`Directive "@${change.meta.addedDirectiveName}" is missing a definition.`);
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
    handleError(
      change,
      new AddedCoordinateAlreadyExistsError(Kind.DIRECTIVE, change.meta.addedDirectiveName),
      config,
    );
  } else if (parentNode) {
    const newDirective: DirectiveNode = {
      kind: Kind.DIRECTIVE,
      name: nameNode(change.meta.addedDirectiveName),
    };
    parentNode.directives = [...(parentNode.directives ?? []), newDirective];
  } else {
    handleError(
      change,
      new ChangedAncestorCoordinateNotFoundError(
        Kind.OBJECT_TYPE_DEFINITION, // or interface...
        'directives',
      ),
      config,
    );
  }
}

function schemaDirectiveUsageDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageSchemaAdded>,
  schemaNodes: SchemaNode[],
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(
      change,
      new ChangedCoordinateNotFoundError(Kind.DIRECTIVE, change.meta.addedDirectiveName),
      config,
    );
    return;
  }
  if (change.meta.addedDirectiveName === 'deprecated') {
    return; // ignore because deprecated is handled by its own change... consider adjusting this.
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
    handleError(
      change,
      new AddedAttributeAlreadyExistsError(
        Kind.SCHEMA_DEFINITION,
        'directives',
        change.meta.addedDirectiveName,
      ),
      config,
    );
  } else {
    const directiveNode: DirectiveNode = {
      kind: Kind.DIRECTIVE,
      name: nameNode(change.meta.addedDirectiveName),
    };
    (schemaNodes[0].directives as DirectiveNode[] | undefined) = [
      ...(schemaNodes[0].directives ?? []),
      directiveNode,
    ];
  }
}

function schemaDirectiveUsageDefinitionRemoved(
  change: Change<DirectiveUsageRemovedChange>,
  schemaNodes: SchemaNode[],
  _nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
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
      // nodeByPath.delete(change.path)
      // nodeByPath.delete(`.@${change.meta.removedDirectiveName}`);
      deleted = true;
      break;
    }
  }
  if (!deleted) {
    handleError(
      change,
      new DeletedAttributeNotFoundError(
        Kind.SCHEMA_DEFINITION,
        'directives',
        change.meta.removedDirectiveName,
      ),
      config,
    );
  }
}

function directiveUsageDefinitionRemoved(
  change: Change<DirectiveUsageRemovedChange>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }

  const parentNode = nodeByPath.get(parentPath(change.path)) as
    | { kind: Kind; directives?: DirectiveNode[] }
    | undefined;
  const directiveNode = findNthDirective(
    parentNode?.directives ?? [],
    change.meta.removedDirectiveName,
    change.meta.directiveRepeatedTimes,
  );
  if (!parentNode) {
    handleError(
      change,
      new DeletedAncestorCoordinateNotFoundError(
        Kind.OBJECT_TYPE_DEFINITION,
        'directives',
        change.meta.removedDirectiveName,
      ),
      config,
    );
  } else if (!directiveNode) {
    handleError(
      change,
      new DeletedAttributeNotFoundError(
        parentNode.kind,
        'directives',
        change.meta.removedDirectiveName,
      ),
      config,
    );
  } else {
    parentNode.directives = parentNode.directives?.filter(
      d => d.name.value !== change.meta.removedDirectiveName,
    );
  }
}

export function directiveUsageArgumentDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageArgumentDefinitionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageArgumentDefinitionRemoved(
  change: Change<typeof ChangeType.DirectiveUsageArgumentDefinitionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageEnumAdded(
  change: Change<typeof ChangeType.DirectiveUsageEnumAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageEnumRemoved(
  change: Change<typeof ChangeType.DirectiveUsageEnumRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageEnumValueAdded(
  change: Change<typeof ChangeType.DirectiveUsageEnumValueAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageEnumValueRemoved(
  change: Change<typeof ChangeType.DirectiveUsageEnumValueRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageFieldAdded(
  change: Change<typeof ChangeType.DirectiveUsageFieldAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageFieldDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageFieldDefinitionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageFieldDefinitionRemoved(
  change: Change<typeof ChangeType.DirectiveUsageFieldDefinitionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageFieldRemoved(
  change: Change<typeof ChangeType.DirectiveUsageFieldRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageInputFieldDefinitionAdded(
  change: Change<typeof ChangeType.DirectiveUsageInputFieldDefinitionAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageInputFieldDefinitionRemoved(
  change: Change<typeof ChangeType.DirectiveUsageInputFieldDefinitionRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageInputObjectAdded(
  change: Change<typeof ChangeType.DirectiveUsageInputObjectAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageInputObjectRemoved(
  change: Change<typeof ChangeType.DirectiveUsageInputObjectRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageInterfaceAdded(
  change: Change<typeof ChangeType.DirectiveUsageInterfaceAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageInterfaceRemoved(
  change: Change<typeof ChangeType.DirectiveUsageInterfaceRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageObjectAdded(
  change: Change<typeof ChangeType.DirectiveUsageObjectAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageObjectRemoved(
  change: Change<typeof ChangeType.DirectiveUsageObjectRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageScalarAdded(
  change: Change<typeof ChangeType.DirectiveUsageScalarAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageScalarRemoved(
  change: Change<typeof ChangeType.DirectiveUsageScalarRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageSchemaAdded(
  change: Change<typeof ChangeType.DirectiveUsageSchemaAdded>,
  schemaDefs: SchemaNode[],
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return schemaDirectiveUsageDefinitionAdded(change, schemaDefs, nodeByPath, config);
}

export function directiveUsageSchemaRemoved(
  change: Change<typeof ChangeType.DirectiveUsageSchemaRemoved>,
  schemaDefs: SchemaNode[],
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return schemaDirectiveUsageDefinitionRemoved(change, schemaDefs, nodeByPath, config);
}

export function directiveUsageUnionMemberAdded(
  change: Change<typeof ChangeType.DirectiveUsageUnionMemberAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionAdded(change, nodeByPath, config);
}

export function directiveUsageUnionMemberRemoved(
  change: Change<typeof ChangeType.DirectiveUsageUnionMemberRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  return directiveUsageDefinitionRemoved(change, nodeByPath, config);
}

export function directiveUsageArgumentAdded(
  change: Change<typeof ChangeType.DirectiveUsageArgumentAdded>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
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
    handleError(
      change,
      new AddedAttributeCoordinateNotFoundError(
        change.meta.directiveName,
        'arguments',
        change.meta.addedArgumentName,
      ),
      config,
    );
  } else if (directiveNode.kind === Kind.DIRECTIVE) {
    const existing = findNamedNode(directiveNode.arguments, change.meta.addedArgumentName);
    if (existing) {
      handleError(
        change,
        new AddedAttributeAlreadyExistsError(
          directiveNode.kind,
          'arguments',
          change.meta.addedArgumentName,
        ),
        config,
      );
    } else {
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
  } else {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE, directiveNode.kind),
      config,
    );
  }
}

export function directiveUsageArgumentRemoved(
  change: Change<typeof ChangeType.DirectiveUsageArgumentRemoved>,
  nodeByPath: Map<string, ASTNode>,
  config: PatchConfig,
) {
  if (!change.path) {
    handleError(change, new ChangePathMissingError(change), config);
    return;
  }
  const parentNode = nodeByPath.get(parentPath(change.path)) as
    | { kind: Kind; directives?: DirectiveNode[] }
    | undefined;
  // if (
  //   change.meta.directiveName === 'deprecated' &&
  //   parentNode && (parentNode.kind === Kind.FIELD_DEFINITION || parentNode.kind === Kind.ENUM_VALUE_DEFINITION)
  // ) {
  //   return; // ignore because deprecated is handled by its own change... consider adjusting this.
  // }

  const directiveNode = findNthDirective(
    parentNode?.directives ?? [],
    change.meta.directiveName,
    change.meta.directiveRepeatedTimes,
  );
  if (!directiveNode) {
    handleError(
      change,
      new DeletedAncestorCoordinateNotFoundError(
        Kind.DIRECTIVE,
        'arguments',
        change.meta.removedArgumentName,
      ),
      config,
    );
  } else if (directiveNode.kind === Kind.DIRECTIVE) {
    const existing = findNamedNode(directiveNode.arguments, change.meta.removedArgumentName);
    if (existing) {
      (directiveNode.arguments as ArgumentNode[] | undefined) = (
        directiveNode.arguments as ArgumentNode[] | undefined
      )?.filter(a => a.name.value !== change.meta.removedArgumentName);
      nodeByPath.delete(change.path);
    } else {
      handleError(
        change,
        new DeletedAttributeNotFoundError(
          directiveNode.kind,
          'arguments',
          change.meta.removedArgumentName,
        ),
        config,
      );
    }
  } else {
    handleError(
      change,
      new ChangedCoordinateKindMismatchError(Kind.DIRECTIVE, directiveNode.kind),
      config,
    );
  }
}
