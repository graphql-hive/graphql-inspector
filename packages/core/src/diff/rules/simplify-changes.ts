import { ChangeType } from '../changes/change.js';
import { Rule } from './types.js';

// A change belongs here only when it adds a whole node, so that every nested change
// reported under that node's path is implied by it: a new type implies its fields.
// A change that edits an existing node at its own path, such as a description or an
// interface added to it, must not be listed, since it would hide every other change
// to that node and to its children.
const simpleChangeTypes = new Set([
  ChangeType.DirectiveAdded,
  ChangeType.DirectiveUsageArgumentAdded,
  ChangeType.DirectiveUsageArgumentDefinitionAdded,
  ChangeType.DirectiveUsageEnumAdded,
  ChangeType.DirectiveUsageEnumValueAdded,
  ChangeType.DirectiveUsageFieldAdded,
  ChangeType.DirectiveUsageFieldDefinitionAdded,
  ChangeType.DirectiveUsageInputFieldDefinitionAdded,
  ChangeType.DirectiveUsageInputObjectAdded,
  ChangeType.DirectiveUsageInterfaceAdded,
  ChangeType.DirectiveUsageObjectAdded,
  ChangeType.DirectiveUsageScalarAdded,
  ChangeType.DirectiveUsageSchemaAdded,
  ChangeType.DirectiveUsageUnionMemberAdded,
  ChangeType.EnumValueAdded,
  ChangeType.EnumValueDeprecationReasonAdded,
  ChangeType.FieldAdded,
  ChangeType.FieldArgumentAdded,
  ChangeType.FieldDeprecationAdded,

  // These are not additions -- but this is necessary to eliminate nested removals for directives
  // because the deprecationReasons are redundant with directives
  ChangeType.FieldDeprecationRemoved,
  ChangeType.FieldDeprecationReasonChanged,
  ChangeType.EnumValueDeprecationReasonChanged,

  ChangeType.FieldDeprecationReasonAdded,
  ChangeType.InputFieldAdded,
  ChangeType.TypeAdded,
]);

const parentPath = (path: string) => {
  const lastDividerIndex = path.lastIndexOf('.');
  return lastDividerIndex === -1 ? path : path.substring(0, lastDividerIndex);
};

export const simplifyChanges: Rule = ({ changes }) => {
  // Track which paths contained changes that represent a group of changes to the schema
  // e.g. the addition of a type implicity contains the addition of that type's fields.
  const changePaths: string[] = [];

  const filteredChanges = changes.filter(({ path, type }) => {
    if (path) {
      const parent = parentPath(path);
      // check if parent or the current node was changed using a
      // "simple change" (aka a change that encapsulates a group of changes)
      const matches = changePaths.filter(
        matchedPath => matchedPath === parent || matchedPath === path,
      );
      const hasChangedParent = matches.length > 0;

      if (simpleChangeTypes.has(type)) {
        changePaths.push(path);
      }

      return !hasChangedParent;
    }
    return true;
  });

  return filteredChanges;
};
