import { ChangeType } from '../changes/change.js';
import { Rule } from './types.js';

const simpleChangeTypes = new Set([
  ChangeType.DirectiveAdded,
  ChangeType.DirectiveArgumentAdded,
  ChangeType.DirectiveLocationAdded,
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
  ChangeType.FieldDescriptionAdded,
  ChangeType.InputFieldAdded,
  ChangeType.InputFieldDescriptionAdded,
  ChangeType.ObjectTypeInterfaceAdded,
  ChangeType.TypeAdded,
  ChangeType.TypeDescriptionAdded,
  ChangeType.UnionMemberAdded,
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
      const matches = changePaths.filter(matchedPath => matchedPath.startsWith(parent));
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
