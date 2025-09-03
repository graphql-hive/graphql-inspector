import { expectPatchToMatch } from './utils.js';

const baseSchema = /* GraphQL */ `
  schema {
    query: Query
    mutation: Mutation
  }
  directive @meta(
    name: String!
    value: String!
  ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
  enum Flavor {
    SWEET
    SOUR
    SAVORY
    UMAMI
  }
  scalar Calories
  interface Food {
    name: String!
    flavors: [Flavor!]
  }
  type Drink implements Food {
    name: String!
    flavors: [Flavor!]
    volume: Int
  }
  type Burger {
    name: String!
    flavors: [Flavor!]
    toppings: [Food]
  }
  union Snack = Drink | Burger
  type Query {
    food(name: String!): Food
  }
  type Mutation {
    eat(input: EatInput): Calories
  }
  input EatInput {
    foodName: String!
  }
`;

describe('directiveUsages: added', () => {
  test('directiveUsageFieldDefinitionAdded: @deprecated', async () => {
    const before = `
      type Foo {
        new: String
        old: String
      }
    `;
    const after = /* GraphQL */ `
      type Foo {
        new: String
        old: String @deprecated(reason: "No good")
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageArgumentDefinitionAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String! @meta(name: "owner", value: "kitchen")): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageInputFieldDefinitionAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String! @meta(name: "owner", value: "kitchen")
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageInputObjectAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput @meta(name: "owner", value: "kitchen") {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageInterfaceAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food @meta(name: "owner", value: "kitchen") {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageObjectAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger @meta(name: "owner", value: "kitchen") {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageEnumAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor @meta(name: "owner", value: "kitchen") {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageFieldDefinitionAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String! @meta(name: "owner", value: "kitchen")
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageUnionMemberAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack @meta(name: "owner", value: "kitchen") = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageEnumValueAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI @meta(name: "source", value: "mushrooms")
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageSchemaAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema @meta(name: "owner", value: "kitchen") {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageScalarAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories @meta(name: "owner", value: "kitchen")
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageFieldAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String! @meta(name: "owner", value: "kitchen")
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });
});

describe('directiveUsages: removed', () => {
  test('directiveUsageArgumentDefinitionRemoved', async () => {
    const before = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageInputFieldDefinitionRemoved', async () => {
    const before = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String! @meta(name: "owner", value: "kitchen")
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageInputObjectRemoved', async () => {
    const before = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput @meta(name: "owner", value: "kitchen") {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageInterfaceRemoved', async () => {
    const before = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food @meta(name: "owner", value: "kitchen") {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageObjectRemoved', async () => {
    const before = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger @meta(name: "owner", value: "kitchen") {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageEnumRemoved', async () => {
    const before = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor @meta(name: "owner", value: "kitchen") {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageFieldDefinitionRemoved', async () => {
    const before = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!] @meta(name: "owner", value: "kitchen")
      }
      type Drink implements Food {
        name: String! @meta(name: "owner", value: "kitchen")
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageUnionMemberRemoved', async () => {
    const before = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack @meta(name: "owner", value: "kitchen") = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageEnumValueRemoved', async () => {
    const before = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET @meta(name: "owner", value: "kitchen")
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageSchemaRemoved', async () => {
    const before = /* GraphQL */ `
      schema @meta(name: "owner", value: "kitchen") {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('directiveUsageScalarRemoved', async () => {
    const before = /* GraphQL */ `
      schema {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories @meta(name: "owner", value: "kitchen")
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });

  test('schemaDirectiveUsageDefinitionAdded', async () => {
    const before = baseSchema;
    const after = /* GraphQL */ `
      schema @meta(name: "owner", value: "kitchen") {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories @meta(name: "owner", value: "kitchen")
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('schemaDirectiveUsageDefinitionRemoved', async () => {
    const before = /* GraphQL */ `
      schema @meta(name: "owner", value: "kitchen") {
        query: Query
        mutation: Mutation
      }
      directive @meta(
        name: String!
        value: String!
      ) on SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
      enum Flavor {
        SWEET
        SOUR
        SAVORY
        UMAMI
      }
      scalar Calories
      interface Food {
        name: String!
        flavors: [Flavor!]
      }
      type Drink implements Food {
        name: String!
        flavors: [Flavor!]
        volume: Int
      }
      type Burger {
        name: String!
        flavors: [Flavor!]
        toppings: [Food]
      }
      union Snack = Drink | Burger
      type Query {
        food(name: String!): Food
      }
      type Mutation {
        eat(input: EatInput): Calories
      }
      input EatInput {
        foodName: String!
      }
    `;
    const after = baseSchema;
    await expectPatchToMatch(before, after);
  });
});
