import { GraphQLInterfaceType, Kind } from 'graphql';
import { compareDirectiveLists, compareLists, hasDirectiveUsageAst } from '../utils/compare.js';
import {
  directiveUsageAdded,
  directiveUsageChanged,
  directiveUsageRemoved,
} from './changes/directive-usage.js';
import { fieldAdded, fieldRemoved } from './changes/field.js';
import { objectTypeInterfaceAdded, objectTypeInterfaceRemoved } from './changes/object.js';
import { changesInField } from './field.js';
import type { AddChange, SkipDirectiveUsages } from './schema.js';

export function changesInInterface(
  oldInterface: GraphQLInterfaceType | null,
  newInterface: GraphQLInterfaceType,
  addChange: AddChange,
  skipDirectiveUsages: SkipDirectiveUsages,
): void {
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
      changesInField(newInterface, null, field, addChange, skipDirectiveUsages);
    },
    onRemoved(field) {
      addChange(fieldRemoved(oldInterface!, field));
    },
    onMutual(field) {
      changesInField(
        newInterface,
        field.oldVersion,
        field.newVersion,
        addChange,
        skipDirectiveUsages,
      );
    },
  });

  if (!hasDirectiveUsageAst({ oldNode: oldInterface, newNode: newInterface })) {
    skipDirectiveUsages({ path: newInterface.name, oldNode: oldInterface, newNode: newInterface });
    return;
  }

  compareDirectiveLists(
    oldInterface?.astNode?.directives || [],
    newInterface.astNode?.directives || [],
    {
      onAdded(directive) {
        addChange(
          directiveUsageAdded(
            Kind.INTERFACE_TYPE_DEFINITION,
            directive,
            newInterface,
            oldInterface === null,
          ),
        );
        directiveUsageChanged(null, directive, addChange, newInterface);
      },
      onMutual(directive) {
        directiveUsageChanged(directive.oldVersion, directive.newVersion, addChange, newInterface);
      },
      onRemoved(directive) {
        addChange(directiveUsageRemoved(Kind.INTERFACE_TYPE_DEFINITION, directive, oldInterface!));
      },
    },
  );
}
