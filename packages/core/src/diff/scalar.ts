import { GraphQLScalarType, Kind } from 'graphql';
import { compareDirectiveLists } from '../utils/compare.js';
import {
  directiveUsageAdded,
  directiveUsageChanged,
  directiveUsageRemoved,
} from './changes/directive-usage.js';
import { AddChange } from './schema.js';

export function changesInScalar(
  oldScalar: GraphQLScalarType | null,
  newScalar: GraphQLScalarType,
  addChange: AddChange,
) {
  compareDirectiveLists(oldScalar?.astNode?.directives || [], newScalar.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(Kind.SCALAR_TYPE_DEFINITION, directive, newScalar, oldScalar === null),
      );
      directiveUsageChanged(null, directive, addChange, newScalar);
    },
    onMutual(directive) {
      directiveUsageChanged(directive.oldVersion, directive.newVersion, addChange, newScalar);
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.SCALAR_TYPE_DEFINITION, directive, oldScalar!));
    },
  });
}
