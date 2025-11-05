import { expectDiffAndPatchToMatch } from './utils.js';

describe('directives', () => {
  test('directiveAdded', async () => {
    const before = /* GraphQL */ `
      scalar Food
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('directiveRemoved', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('directiveArgumentAdded', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('directiveArgumentRemoved', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('directiveLocationAdded', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION | OBJECT
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('directiveArgumentDefaultValueChanged', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String = "It tastes good.") on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('directiveDescriptionChanged', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      """
      Signals that this thing is extra yummy
      """
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('directiveArgumentTypeChanged', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(scale: Int) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(scale: Int!) on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('directiveRepeatableAdded', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(scale: Int!) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(scale: Int!) repeatable on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('directiveRepeatableRemoved', async () => {
    const before = /* GraphQL */ `
      directive @tasty(scale: Int!) repeatable on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      directive @tasty(scale: Int!) on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToMatch(before, after);
  });
});

describe('repeat directives', () => {
  test('Directives Added', async () => {
    const before = /* GraphQL */ `
      directive @flavor(flavor: String!) repeatable on OBJECT
      type Pancake @flavor(flavor: "bread") {
        radius: Int!
      }
    `;
    const after = /* GraphQL */ `
      directive @flavor(flavor: String!) repeatable on OBJECT
      type Pancake
        @flavor(flavor: "sweet")
        @flavor(flavor: "bread")
        @flavor(flavor: "chocolate")
        @flavor(flavor: "strawberry") {
        radius: Int!
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('Directives Removed', async () => {
    const before = /* GraphQL */ `
      directive @flavor(flavor: String!) repeatable on OBJECT
      type Pancake
        @flavor(flavor: "sweet")
        @flavor(flavor: "bread")
        @flavor(flavor: "chocolate")
        @flavor(flavor: "strawberry") {
        radius: Int!
      }
    `;
    const after = /* GraphQL */ `
      directive @flavor(flavor: String!) repeatable on OBJECT
      type Pancake @flavor(flavor: "bread") {
        radius: Int!
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('Directive Arguments', async () => {
    const before = /* GraphQL */ `
      directive @flavor(flavor: String) repeatable on OBJECT
      type Pancake
        @flavor(flavor: "sweet")
        @flavor(flavor: "bread")
        @flavor(flavor: "chocolate")
        @flavor(flavor: "strawberry") {
        radius: Int!
      }
    `;
    const after = /* GraphQL */ `
      directive @flavor(flavor: String) repeatable on OBJECT
      type Pancake
        @flavor
        @flavor(flavor: "bread")
        @flavor(flavor: "banana")
        @flavor(flavor: "strawberry") {
        radius: Int!
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });
});
