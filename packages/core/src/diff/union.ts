import { GraphQLUnionType, Kind } from 'graphql';
import { compareDirectiveLists, compareLists, hasDirectiveUsageAst } from '../utils/compare.js';
import {
  directiveUsageAdded,
  directiveUsageChanged,
  directiveUsageRemoved,
} from './changes/directive-usage.js';
import { unionMemberAdded, unionMemberRemoved } from './changes/union.js';
import type { AddChange, SkipDirectiveUsages } from './schema.js';

export function changesInUnion(
  oldUnion: GraphQLUnionType | null,
  newUnion: GraphQLUnionType,
  addChange: AddChange,
  skipDirectiveUsages: SkipDirectiveUsages,
): void {
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

  if (!hasDirectiveUsageAst({ oldNode: oldUnion, newNode: newUnion })) {
    skipDirectiveUsages({ path: newUnion.name, oldNode: oldUnion, newNode: newUnion });
    return;
  }

  compareDirectiveLists(oldUnion?.astNode?.directives || [], newUnion.astNode?.directives || [], {
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
