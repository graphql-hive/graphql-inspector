import { GraphQLUnionType, Kind } from 'graphql';
import { compareLists } from '../utils/compare.js';
import {
  directiveUsageAdded,
  directiveUsageChanged,
  directiveUsageRemoved,
} from './changes/directive-usage.js';
import { unionMemberAdded, unionMemberRemoved } from './changes/union.js';
import { AddChange } from './schema.js';

export function changesInUnion(
  oldUnion: GraphQLUnionType | null,
  newUnion: GraphQLUnionType,
  addChange: AddChange,
) {
  const oldTypes = oldUnion?.getTypes() ?? [];
  const newTypes = newUnion.getTypes();

  compareLists(oldTypes, newTypes, {
    onAdded(t) {
      addChange(unionMemberAdded(newUnion, t, oldUnion === null));
    },
    onRemoved(t) {
      addChange(unionMemberRemoved(oldUnion!, t));
    },
  });

  compareLists(oldUnion?.astNode?.directives || [], newUnion.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(Kind.UNION_TYPE_DEFINITION, directive, newUnion, oldUnion === null),
      );
      directiveUsageChanged(null, directive, addChange, newUnion);
    },
    onMutual(directive) {
      directiveUsageChanged(directive.oldVersion, directive.newVersion, addChange, newUnion);
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.UNION_TYPE_DEFINITION, directive, oldUnion!));
    },
  });
}
