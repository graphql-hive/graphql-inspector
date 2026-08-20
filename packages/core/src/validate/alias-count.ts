import { DepGraph } from 'dependency-graph';
import type {
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  OperationDefinitionNode,
  Source,
} from 'graphql';
import { GraphQLError, Kind } from 'graphql';

export function validateAliasCount({
  source,
  doc,
  maxAliasCount,
  fragmentGraph,
}: {
  source: Source;
  doc: DocumentNode;
  maxAliasCount: number;
  fragmentGraph: DepGraph<FragmentDefinitionNode>;
}): GraphQLError | void {
  const getFragmentByFragmentName = (fragmentName: string) =>
    fragmentGraph.getNodeData(fragmentName);

  for (const definition of doc.definitions) {
    if (definition.kind !== Kind.OPERATION_DEFINITION) {
      continue;
    }
    const aliasCount = countAliases(definition, getFragmentByFragmentName);
    if (aliasCount > maxAliasCount) {
      return new GraphQLError(
        `Too many aliases (${aliasCount}). Maximum allowed is ${maxAliasCount}`,
        {
          source,
          nodes: [definition],
          positions: definition.loc?.start ? [definition.loc.start] : undefined,
        },
      );
    }
  }
}

export function countAliases(
  node:
    | FieldNode
    | FragmentDefinitionNode
    | InlineFragmentNode
    | OperationDefinitionNode
    | FragmentSpreadNode,
  getFragmentByName: (fragmentName: string) => FragmentDefinitionNode | undefined,
) {
  let aliases = 0;
  if ('alias' in node && node.alias) {
    ++aliases;
  }
  if ('selectionSet' in node && node.selectionSet) {
    for (const child of node.selectionSet.selections) {
      aliases += countAliases(child, getFragmentByName);
    }
  } else if (node.kind === Kind.FRAGMENT_SPREAD) {
    const fragmentNode = getFragmentByName(node.name.value);
    if (fragmentNode) {
      aliases += countAliases(fragmentNode, getFragmentByName);
    }
  }
  return aliases;
}
