import { DepGraph } from 'dependency-graph';
import {
  ASTNode,
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  GraphQLError,
  InlineFragmentNode,
  Kind,
  OperationDefinitionNode,
  Source,
} from 'graphql';

export function validateQueryDepth({
  source,
  doc,
  maxDepth,
  fragmentGraph,
}: {
  source: Source;
  doc: DocumentNode;
  maxDepth: number;
  fragmentGraph: DepGraph<FragmentDefinitionNode>;
}): GraphQLError | void {
  try {
    calculateDepth({
      node: doc,
      currentDepth: 0,
      maxDepth,
      getFragment(name) {
        return fragmentGraph.getNodeData(name);
      },
    });
  } catch (errorOrNode: any) {
    if (errorOrNode instanceof Error) {
      throw errorOrNode;
    }

    const node: ASTNode = errorOrNode;

    return new GraphQLError(`Query exceeds maximum depth of ${maxDepth}`, {
      nodes: node,
      source,
      positions: node.loc?.start ? [node.loc.start] : undefined,
    });
  }
}

export function calculateDepth({
  node,
  currentDepth,
  maxDepth,
  getFragment,
}: {
  node: ASTNode;
  currentDepth: number;
  maxDepth?: number;
  getFragment: (fragmentName: string) => FragmentDefinitionNode;
}): number | never {
  if (maxDepth && currentDepth > maxDepth) {
    throw node;
  }

  switch (node.kind) {
    case Kind.FIELD: {
      if (node.name.value.startsWith('__') || !node.selectionSet) {
        return 0;
      }

      const maxInnerDepth = calculateDepth({
        node: node.selectionSet,
        currentDepth: currentDepth + 1,
        maxDepth,
        getFragment,
      });

      return 1 + maxInnerDepth;
    }

    case Kind.SELECTION_SET: {
      return Math.max(
        ...node.selections.map(selection => {
          return calculateDepth({
            node: selection,
            currentDepth,
            maxDepth,
            getFragment,
          });
        }),
      );
    }

    case Kind.DOCUMENT: {
      return Math.max(
        ...node.definitions.map(def => {
          return calculateDepth({
            node: def,
            currentDepth,
            maxDepth,
            getFragment,
          });
        }),
      );
    }

    case Kind.OPERATION_DEFINITION:
    case Kind.INLINE_FRAGMENT:
    case Kind.FRAGMENT_DEFINITION: {
      return Math.max(
        ...node.selectionSet.selections.map(selection => {
          return calculateDepth({
            node: selection,
            currentDepth,
            maxDepth,
            getFragment,
          });
        }),
      );
    }

    case Kind.FRAGMENT_SPREAD:
      return calculateDepth({
        node: getFragment(node.name.value),
        currentDepth,
        maxDepth,
        getFragment,
      });

    default: {
      throw new Error(`Couldn't handle ${node.kind}`);
    }
  }
}

export function countDepth(
  node:
    | FieldNode
    | FragmentDefinitionNode
    | InlineFragmentNode
    | OperationDefinitionNode
    | FragmentSpreadNode,
  parentDepth: number,
  getFragmentReference: (name: string) => FragmentDefinitionNode | undefined,
) {
  let depth = parentDepth;

  if ('selectionSet' in node && node.selectionSet) {
    for (const child of node.selectionSet.selections) {
      depth = Math.max(depth, countDepth(child, parentDepth + 1, getFragmentReference));
    }
  }
  if (node.kind === Kind.FRAGMENT_SPREAD) {
    const fragment = getFragmentReference(node.name.value);
    if (fragment) {
      depth = Math.max(depth, countDepth(fragment, parentDepth + 1, getFragmentReference));
    }
  }
  return depth;
}
