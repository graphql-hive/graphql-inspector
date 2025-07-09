import { ChangeType } from '../changes/change.js';
import { Rule } from './types.js';

const additionChangeTypes = new Set([
  ChangeType.DirectiveAdded,
  ChangeType.DirectiveArgumentAdded,
  ChangeType.DirectiveLocationAdded,
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
  ChangeType.FieldDeprecationReasonAdded,
  ChangeType.FieldDescriptionAdded,
  ChangeType.InputFieldAdded,
  ChangeType.InputFieldDescriptionAdded,
  ChangeType.ObjectTypeInterfaceAdded,
  ChangeType.TypeAdded,
  ChangeType.TypeDescriptionAdded,
  ChangeType.UnionMemberAdded,
]);

export const ignoreNestedAdditions: Rule = ({ changes }) => {
  // Track which paths contained changes that represent additions to the schema
  const additionPaths: string[] = [];

  const filteredChanges = changes.filter(({ path, type }) => {
    if (path) {
      const parentPath = path?.substring(0, path.lastIndexOf('.')) ?? '';
      const matches = additionPaths.filter(matchedPath => matchedPath.includes(parentPath));
      const hasAddedParent = matches.length > 0;

      if (additionChangeTypes.has(type)) {
        additionPaths.push(path);
      }

      return !hasAddedParent;
    }
    return true;
  });

  return filteredChanges;
};
