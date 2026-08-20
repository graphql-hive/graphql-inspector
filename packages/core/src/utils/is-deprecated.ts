import { GraphQLArgument, GraphQLEnumValue, GraphQLField, GraphQLInputField } from 'graphql';

export function isDeprecated(
  fieldOrEnumValue:
    | GraphQLField<any, any>
    | GraphQLEnumValue
    | GraphQLInputField
    | GraphQLArgument,
): boolean {
  if ('isDeprecated' in fieldOrEnumValue) {
    return !!fieldOrEnumValue['isDeprecated'];
  }
  if (fieldOrEnumValue.deprecationReason != null) {
    return true;
  }
  if (
    fieldOrEnumValue.astNode?.directives?.some(directive => directive.name.value === 'deprecated')
  ) {
    return true;
  }
  return false;
}
