import { GraphQLUnionType, Kind } from 'graphql';
import { compareLists } from '../utils/compare.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
import { unionMemberAdded, unionMemberRemoved } from './changes/union.js';
import { AddChange } from './schema.js';

export function changesInUnion(
  oldUnion: GraphQLUnionType,
  newUnion: GraphQLUnionType,
  addChange: AddChange,
) {
  const oldTypes = oldUnion.getTypes();
  const newTypes = newUnion.getTypes();

  compareLists(oldTypes, newTypes, {
    onAdded(t) {
      addChange(unionMemberAdded(newUnion, t));
    },
    onRemoved(t) {
      addChange(unionMemberRemoved(oldUnion, t));
    },
  });

  // TODO: Heshan -> Introduce a mutual option to this function to detect changes in directive usage
  compareLists(oldUnion.astNode?.directives || [], newUnion.astNode?.directives || [], {
    onAdded(directive) {
      addChange(directiveUsageAdded(Kind.UNION_TYPE_DEFINITION, directive, newUnion));
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.UNION_TYPE_DEFINITION, directive, oldUnion));
    },
  });
}
