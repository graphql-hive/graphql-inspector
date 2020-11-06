import {
  GraphQLArgument,
  GraphQLObjectType,
  GraphQLField,
  GraphQLInterfaceType,
} from 'graphql';

import {diffArrays, isNotEqual} from '../utils/compare';
import {
  fieldArgumentDescriptionChanged,
  fieldArgumentDefaultChanged,
  fieldArgumentTypeChanged,
} from './changes/argument';
import { AddChange } from './schema';

export function changesInArgument(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  oldArg: GraphQLArgument,
  newArg: GraphQLArgument,
  addChange: AddChange
) {
  if (isNotEqual(oldArg.description, newArg.description)) {
    addChange(fieldArgumentDescriptionChanged(type, field, oldArg, newArg));
  }

  if (isNotEqual(oldArg.defaultValue, newArg.defaultValue)) {
    if (
      Array.isArray(oldArg.defaultValue) &&
      Array.isArray(newArg.defaultValue)
    ) {
      const diff = diffArrays(oldArg.defaultValue, newArg.defaultValue);
      if (diff.length > 0) {
        addChange(fieldArgumentDefaultChanged(type, field, oldArg, newArg));
      }
    } else if (
      JSON.stringify(oldArg.defaultValue) !==
      JSON.stringify(newArg.defaultValue)
    ) {
      addChange(fieldArgumentDefaultChanged(type, field, oldArg, newArg));
    }
  }

  if (isNotEqual(oldArg.type.toString(), newArg.type.toString())) {
    addChange(fieldArgumentTypeChanged(type, field, oldArg, newArg));
  }
}
