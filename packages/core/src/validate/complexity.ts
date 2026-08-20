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

export type CalculateOperationComplexityConfig = {
  scalarCost: number;
  objectCost: number;
  depthCostFactor: number;
};

export type ValidateOperationComplexityConfig = {
  maxComplexityScore: number;
  complexityScalarCost: number;
  complexityObjectCost: number;
  complexityDepthCostFactor: number;
};

export function validateComplexity({
  source,
  doc,
  maxComplexityScore,
  config,
  fragmentGraph,
}: {
  source: Source;
  doc: DocumentNode;
  maxComplexityScore: number;
  config: CalculateOperationComplexityConfig;
  fragmentGraph: DepGraph<FragmentDefinitionNode>;
}): GraphQLError | void {
  const getFragmentByFragmentName = (fragmentName: string) =>
    fragmentGraph.getNodeData(fragmentName);

  for (const definition of doc.definitions) {
    if (definition.kind !== Kind.OPERATION_DEFINITION) {
      continue;
    }
    const complexityScore = calculateOperationComplexity(
      definition,
      config,
      getFragmentByFragmentName,
    );
    if (complexityScore > maxComplexityScore) {
      return new GraphQLError(
        `Too high complexity score (${complexityScore}). Maximum allowed is ${maxComplexityScore}`,
        {
          nodes: [definition],
          positions: definition.loc?.start ? [definition.loc.start] : undefined,
          source,
        },
      );
    }
  }
}

export function calculateOperationComplexity(
  node:
    | FieldNode
    | FragmentDefinitionNode
    | InlineFragmentNode
    | OperationDefinitionNode
    | FragmentSpreadNode,
  config: CalculateOperationComplexityConfig,
  getFragmentByName: (fragmentName: string) => FragmentDefinitionNode | undefined,
  depth = 0,
) {
  let cost = config.scalarCost;
  if ('selectionSet' in node && node.selectionSet) {
    cost = config.objectCost;
    for (const child of node.selectionSet.selections) {
      cost +=
        config.depthCostFactor *
        calculateOperationComplexity(child, config, getFragmentByName, depth + 1);
    }
  }

  if (node.kind === Kind.FRAGMENT_SPREAD) {
    const fragment = getFragmentByName(node.name.value);
    if (fragment) {
      cost +=
        config.depthCostFactor *
        calculateOperationComplexity(fragment, config, getFragmentByName, depth + 1);
    }
  }

  return cost;
}
