import { GraphQLObjectType } from 'graphql';

import { objectTypeInterfaceAdded, objectTypeInterfaceRemoved } from './changes/object';
import { fieldRemoved, fieldAdded } from './changes/field';
import { changesInField } from './field';
import { compareLists, isNotEqual, isVoid } from '../utils/compare';
import { AddChange } from './schema';
import { typeDescriptionAdded, typeDescriptionRemoved, typeDescriptionChanged } from './changes/type';

export function changesInObject(oldType: GraphQLObjectType, newType: GraphQLObjectType, addChange: AddChange) {
  const oldInterfaces = oldType.getInterfaces();
  const newInterfaces = newType.getInterfaces();

  const oldFields = oldType.getFields();
  const newFields = newType.getFields();
  
  if (isNotEqual(oldType.description, newType.description)) {
    if (isVoid(oldType.description)) {
      addChange(typeDescriptionAdded(newType));
    } else if (isVoid(newType.description)) {
      addChange(typeDescriptionRemoved(oldType));
    } else {
      addChange(typeDescriptionChanged(oldType, newType));
    }
  }

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
}
