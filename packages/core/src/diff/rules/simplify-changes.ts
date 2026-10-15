import { ChangeType } from '../changes/change.js';
import { Rule } from './types.js';

// Changes that hide the changes they implicitly contain. Additions of a whole node contain every
// change on and below the added node's path. Member and interface additions
// (UnionMemberAdded, ObjectTypeInterfaceAdded) are not in the set: their path is the type itself,
// so they would hide unrelated changes on that type.
const hidingChangeTypes = new Set<ChangeType>([
  ChangeType.TypeAdded,
  ChangeType.FieldAdded,
  ChangeType.InputFieldAdded,
  ChangeType.EnumValueAdded,
  ChangeType.DirectiveAdded,
  // A `@deprecated` change is reported both as a deprecation change and as directive usage changes
  // on and below the same `<node>.@deprecated` path. The deprecation change hides only those
  // redundant directive usage changes, never anything on the deprecated node itself.
  ChangeType.FieldDeprecationAdded,
  ChangeType.FieldDeprecationRemoved,
  ChangeType.FieldDeprecationReasonChanged,
  ChangeType.EnumValueDeprecationReasonChanged,
]);

export const simplifyChanges: Rule = ({ changes }) => {
  const hidingPaths = new Set<string>();
  for (const { path, type } of changes) {
    if (path && hidingChangeTypes.has(type)) {
      hidingPaths.add(path);
    }
  }

  // A change is dropped when its path is under a hiding path. A non-hiding change on the hiding
  // path itself is dropped too; a hiding change is dropped only under a strict ancestor.
  // Examples:
  // - TypeAdded `Foo` + FieldAdded `Foo.a` + FieldDescriptionAdded `Foo.a` → TypeAdded `Foo`
  // - TypeAdded `U` + UnionMemberAdded `U` → TypeAdded `U`
  // - FieldAdded `Foo.b` + FieldDeprecationAdded `Foo.b.@deprecated` → FieldAdded `Foo.b`
  // - FieldDeprecationAdded `Foo.bar.@deprecated` + DirectiveUsageFieldDefinitionAdded
  //   `Foo.bar.@deprecated` + DirectiveUsageArgumentAdded `Foo.bar.@deprecated.reason`
  //   → FieldDeprecationAdded `Foo.bar.@deprecated`
  // - FieldDescriptionAdded `Mutation.do` + FieldTypeChanged `Mutation.do` → both kept
  // - FieldDeprecationAdded `Foo.bar.@deprecated` + FieldTypeChanged `Foo.bar` → both kept
  // - UnionMemberAdded `U` + UnionMemberRemoved `U` → both kept
  // - [TypeDescriptionAdded `Foo`, FieldRemoved `Foo.b`] and its reverse → both kept either way
  return changes.filter(({ path, type }) => {
    if (!path) {
      return true;
    }
    if (!hidingChangeTypes.has(type) && hidingPaths.has(path)) {
      return false;
    }
    for (
      let dividerIndex = path.lastIndexOf('.');
      dividerIndex > 0;
      dividerIndex = path.lastIndexOf('.', dividerIndex - 1)
    ) {
      if (hidingPaths.has(path.substring(0, dividerIndex))) {
        return false;
      }
    }
    return true;
  });
};
