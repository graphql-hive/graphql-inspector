import { GraphQLObjectType, Kind } from 'graphql';
import { compareLists } from '../utils/compare.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
import { fieldAdded, fieldRemoved } from './changes/field.js';
import { objectTypeInterfaceAdded, objectTypeInterfaceRemoved } from './changes/object.js';
import { changesInField } from './field.js';
import { AddChange } from './schema.js';

export function changesInObject(
  oldType: GraphQLObjectType,
  newType: GraphQLObjectType,
  addChange: AddChange,
) {
  const oldInterfaces = oldType.getInterfaces();
  const newInterfaces = newType.getInterfaces();

  const oldFields = oldType.getFields();
  const newFields = newType.getFields();

  compareLists(oldInterfaces, newInterfaces, {
    onAdded(i) {
      addChange(objectTypeInterfaceAdded(i, newType));
    },
    onRemoved(i) {
      addChange(objectTypeInterfaceRemoved(i, oldType));
    },
  });

  compareLists(Object.values(oldFields), Object.values(newFields), {
    onAdded(f) {
      addChange(fieldAdded(newType, f));
    },
    onRemoved(f) {
      addChange(fieldRemoved(oldType, f));
    },
    onMutual(f) {
      changesInField(oldType, f.oldVersion, f.newVersion, addChange);
    },
  });

  // TODO: Heshan -> Introduce a mutual option to this function to detect changes in directive usage
  compareLists(oldType.astNode?.directives || [], newType.astNode?.directives || [], {
    onAdded(directive) {
      addChange(directiveUsageAdded(Kind.OBJECT, directive, newType));
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.OBJECT, directive, oldType));
    },
  });
}
