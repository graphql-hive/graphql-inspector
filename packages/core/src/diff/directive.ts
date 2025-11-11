import { GraphQLArgument, GraphQLDirective } from 'graphql';
import { compareLists, diffArrays, isNotEqual } from '../utils/compare.js';
import {
  directiveArgumentAdded,
  directiveArgumentDefaultValueChanged,
  directiveArgumentDescriptionChanged,
  directiveArgumentRemoved,
  directiveArgumentTypeChanged,
  directiveDescriptionChanged,
  directiveLocationAdded,
  directiveLocationRemoved,
  directiveRepeatableAdded,
  directiveRepeatableRemoved,
} from './changes/directive.js';
import { AddChange } from './schema.js';

export function changesInDirective(
  oldDirective: GraphQLDirective | null,
  newDirective: GraphQLDirective,
  addChange: AddChange,
) {
  if (isNotEqual(oldDirective?.description, newDirective.description)) {
    addChange(directiveDescriptionChanged(oldDirective, newDirective));
  }

  // repeatable removed
  if (!newDirective.isRepeatable && oldDirective?.isRepeatable) {
    addChange(directiveRepeatableRemoved(newDirective));
  }

  // repeatable added
  if (newDirective.isRepeatable && !oldDirective?.isRepeatable) {
    addChange(directiveRepeatableAdded(newDirective));
  }

  const locations = {
    added: diffArrays(newDirective.locations, oldDirective?.locations ?? []),
    removed: diffArrays(oldDirective?.locations ?? [], newDirective.locations),
  };

  // locations added
  for (const location of locations.added)
    addChange(directiveLocationAdded(newDirective, location as any));

  // locations removed
  for (const location of locations.removed)
    addChange(directiveLocationRemoved(newDirective, location as any));

  compareLists(oldDirective?.args ?? [], newDirective.args, {
    onAdded(arg) {
      addChange(directiveArgumentAdded(newDirective, arg, oldDirective === null));
    },
    onRemoved(arg) {
      addChange(directiveArgumentRemoved(newDirective, arg));
    },
    onMutual(arg) {
      changesInDirectiveArgument(newDirective, arg.oldVersion!, arg.newVersion, addChange);
    },
  });
}

function changesInDirectiveArgument(
  directive: GraphQLDirective,
  oldArg: GraphQLArgument,
  newArg: GraphQLArgument,
  addChange: AddChange,
) {
  if (isNotEqual(oldArg?.description, newArg.description)) {
    addChange(directiveArgumentDescriptionChanged(directive, oldArg, newArg));
  }

  if (isNotEqual(oldArg?.defaultValue, newArg.defaultValue)) {
    addChange(directiveArgumentDefaultValueChanged(directive, oldArg, newArg));
  }

  if (isNotEqual(oldArg.type.toString(), newArg.type.toString())) {
    addChange(directiveArgumentTypeChanged(directive, oldArg, newArg));
  }
}
