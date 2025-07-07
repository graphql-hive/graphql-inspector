import { GraphQLScalarType, Kind } from 'graphql';
import { compareLists } from '../utils/compare.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
import { AddChange } from './schema.js';

export function changesInScalar(
  oldScalar: GraphQLScalarType | null,
  newScalar: GraphQLScalarType,
  addChange: AddChange,
) {
  compareLists(oldScalar?.astNode?.directives || [], newScalar.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(Kind.SCALAR_TYPE_DEFINITION, directive, newScalar, oldScalar === null),
      );
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.SCALAR_TYPE_DEFINITION, directive, oldScalar!));
    },
  });
}
