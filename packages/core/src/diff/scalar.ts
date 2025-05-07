import { GraphQLScalarType, Kind } from 'graphql';
import { compareLists } from '../utils/compare.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
import { AddChange } from './schema.js';

export function changesInScalar(
  oldScalar: GraphQLScalarType,
  newScalar: GraphQLScalarType,
  addChange: AddChange,
) {
  // TODO: Heshan -> Introduce a mutual option to this function to detect changes in directive usage
  compareLists(oldScalar.astNode?.directives || [], newScalar.astNode?.directives || [], {
    onAdded(directive) {
      addChange(directiveUsageAdded(Kind.SCALAR_TYPE_DEFINITION, directive, newScalar));
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.SCALAR_TYPE_DEFINITION, directive, oldScalar));
    },
  });
}
