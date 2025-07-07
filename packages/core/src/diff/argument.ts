import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  Kind,
} from 'graphql';
import { compareLists, diffArrays, isNotEqual } from '../utils/compare.js';
import {
  fieldArgumentDefaultChanged,
  fieldArgumentDescriptionChanged,
  fieldArgumentTypeChanged,
} from './changes/argument.js';
import { directiveUsageAdded, directiveUsageRemoved } from './changes/directive-usage.js';
import { AddChange } from './schema.js';

export function changesInArgument(
  type: GraphQLObjectType | GraphQLInterfaceType,
  field: GraphQLField<any, any, any>,
  oldArg: GraphQLArgument | null,
  newArg: GraphQLArgument,
  addChange: AddChange,
) {
  if (isNotEqual(oldArg?.description, newArg.description)) {
    addChange(fieldArgumentDescriptionChanged(type, field, oldArg, newArg));
  }

  if (isNotEqual(oldArg?.defaultValue, newArg.defaultValue)) {
    if (Array.isArray(oldArg?.defaultValue) && Array.isArray(newArg.defaultValue)) {
      const diff = diffArrays(oldArg.defaultValue, newArg.defaultValue);
      if (diff.length > 0) {
        addChange(fieldArgumentDefaultChanged(type, field, oldArg, newArg));
      }
    } else if (JSON.stringify(oldArg?.defaultValue) !== JSON.stringify(newArg.defaultValue)) {
      addChange(fieldArgumentDefaultChanged(type, field, oldArg, newArg));
    }
  }

  if (isNotEqual(oldArg?.type.toString(), newArg.type.toString())) {
    addChange(fieldArgumentTypeChanged(type, field, oldArg, newArg));
  }

  if (newArg.astNode?.directives) {
    compareLists(oldArg?.astNode?.directives || [], newArg.astNode.directives || [], {
      onAdded(directive) {
        addChange(
          directiveUsageAdded(
            Kind.ARGUMENT,
            directive,
            {
              argument: newArg,
              field,
              type,
            },
            oldArg === null,
          ),
        );
      },

      onRemoved(directive) {
        addChange(
          directiveUsageRemoved(Kind.ARGUMENT, directive, { argument: oldArg!, field, type }),
        );
      },
    });
  }
}
