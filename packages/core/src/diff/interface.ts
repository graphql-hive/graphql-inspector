import { GraphQLInterfaceType, Kind } from 'graphql';
import { compareLists } from '../utils/compare.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
import { fieldAdded, fieldRemoved } from './changes/field.js';
import { changesInField } from './field.js';
import { AddChange } from './schema.js';

export function changesInInterface(
  oldInterface: GraphQLInterfaceType,
  newInterface: GraphQLInterfaceType,
  addChange: AddChange,
) {
  compareLists(Object.values(oldInterface.getFields()), Object.values(newInterface.getFields()), {
    onAdded(field) {
      addChange(fieldAdded(newInterface, field));
    },
    onRemoved(field) {
      addChange(fieldRemoved(oldInterface, field));
    },
    onMutual(field) {
      changesInField(oldInterface, field.oldVersion, field.newVersion, addChange);
    },
  });
  // TODO: Heshan -> Introduce a mutual option to this function to detect changes in directive usage
  compareLists(oldInterface.astNode?.directives || [], newInterface.astNode?.directives || [], {
    onAdded(directive) {
      addChange(directiveUsageAdded(Kind.INTERFACE_TYPE_DEFINITION, directive, newInterface));
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.INTERFACE_TYPE_DEFINITION, directive, oldInterface));
    },
  });
}
