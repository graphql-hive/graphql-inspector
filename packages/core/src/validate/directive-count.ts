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

export function validateDirectiveCount({
  source,
  doc,
  maxDirectiveCount,
  fragmentGraph,
}: {
  source: Source;
  doc: DocumentNode;
  maxDirectiveCount: number;
  fragmentGraph: DepGraph<FragmentDefinitionNode>;
}): GraphQLError | void {
  const getFragmentByFragmentName = (fragmentName: string) =>
    fragmentGraph.getNodeData(fragmentName);

  for (const definition of doc.definitions) {
    if (definition.kind !== Kind.OPERATION_DEFINITION) {
      continue;
    }
    const directiveCount = countDirectives(definition, getFragmentByFragmentName);
    if (directiveCount > maxDirectiveCount) {
      return new GraphQLError(
        `Too many directives (${directiveCount}). Maximum allowed is ${maxDirectiveCount}`,
        {
          nodes: [definition],
          source,
          positions: definition.loc?.start ? [definition.loc.start] : undefined,
        },
      );
    }
  }
}

export function countDirectives(
  node:
    | FieldNode
    | FragmentDefinitionNode
    | InlineFragmentNode
    | OperationDefinitionNode
    | FragmentSpreadNode,
  getFragmentByName: (fragmentName: string) => FragmentDefinitionNode | undefined,
) {
  let directives = 0;
  if (node.directives) {
    directives += node.directives.length;
  }
  if ('selectionSet' in node && node.selectionSet) {
    for (const child of node.selectionSet.selections) {
      directives += countDirectives(child, getFragmentByName);
    }
  }
  if (node.kind === Kind.FRAGMENT_SPREAD) {
    const fragment = getFragmentByName(node.name.value);
    if (fragment) {
      directives += countDirectives(fragment, getFragmentByName);
    }
  }
  return directives;
}
