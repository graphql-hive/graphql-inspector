import { GraphQLInterfaceType, Kind } from 'graphql';
import { compareLists } from '../utils/compare.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
import { fieldAdded, fieldRemoved } from './changes/field.js';
import { objectTypeInterfaceAdded, objectTypeInterfaceRemoved } from './changes/object.js';
import { changesInField } from './field.js';
import { AddChange } from './schema.js';

export function changesInInterface(
  oldInterface: GraphQLInterfaceType | null,
  newInterface: GraphQLInterfaceType,
  addChange: AddChange,
) {
  const oldInterfaces = oldInterface?.getInterfaces() ?? [];
  const newInterfaces = newInterface.getInterfaces();

  compareLists(oldInterfaces, newInterfaces, {
    onAdded(i) {
      addChange(objectTypeInterfaceAdded(i, newInterface, oldInterface === null));
    },
    onRemoved(i) {
      addChange(objectTypeInterfaceRemoved(i, oldInterface!));
    },
  });

  const oldFields = oldInterface?.getFields() ?? {};
  const newFields = newInterface.getFields();

  compareLists(Object.values(oldFields), Object.values(newFields), {
    onAdded(field) {
      addChange(fieldAdded(newInterface, field));
      changesInField(newInterface, null, field, addChange);
    },
    onRemoved(field) {
      addChange(fieldRemoved(oldInterface!, field));
    },
    onMutual(field) {
      changesInField(newInterface, field.oldVersion, field.newVersion, addChange);
    },
  });
  compareLists(oldInterface?.astNode?.directives || [], newInterface.astNode?.directives || [], {
    onAdded(directive) {
      addChange(
        directiveUsageAdded(
          Kind.INTERFACE_TYPE_DEFINITION,
          directive,
          newInterface,
          oldInterface === null,
        ),
      );
    },
    onRemoved(directive) {
      addChange(directiveUsageRemoved(Kind.INTERFACE_TYPE_DEFINITION, directive, oldInterface!));
    },
  });
}
