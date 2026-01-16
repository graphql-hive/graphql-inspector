import {
  expectDiffAndPatchToMatch,
  expectDiffAndPatchToPass,
  expectDiffAndPatchToThrow,
} from './utils.js';

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

  test('directiveAdded: ignores if directive already exists', async () => {
    const before = /* GraphQL */ `
      scalar Food
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToPass(before, after, after);
  });

  /**
   * @note this is somewhat counter intuitive, but if the directive already exists
   * and has all the same properties of the change -- but with more, then it's
   * assumed that this addition was intentional and there should be no conflict.
   * This change can result in an invalid schema though. If the change adds a
   * directive usage that is lacking these arguments.
   */
  test('directiveAdded: ignores if directive exists but only arguments do not match', async () => {
    const before = /* GraphQL */ `
      scalar Food
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    const patchTarget = /* GraphQL */ `
      scalar Food
      directive @tasty(flavor: String) on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToPass(before, after, patchTarget);
  });

  test('directiveAdded: errors if directive exists but locations do not match', async () => {
    const before = /* GraphQL */ `
      scalar Food
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    const patchTarget = /* GraphQL */ `
      scalar Food
      directive @tasty(flavor: String) on INTERFACE
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
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

  test('directiveRemoved: ignores if patching schema does not have directive', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
    `;
    await expectDiffAndPatchToPass(before, after, after);
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

  test('directiveArgumentAdded: ignores if directive argument is already added', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToPass(before, after, after);
  });

  test('directiveArgumentAdded: errors if directive argument is already added but type differs', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    const patchTarget = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String!) on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
  });

  test('directiveArgumentAdded: errors if directive argument is already added but defaultValue differs', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String = "ok") on FIELD_DEFINITION
    `;
    const patchTarget = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String! = "not ok") on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
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

  test('directiveArgumentRemoved: ignores if non-existent', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToPass(before, after, after);
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

  test('directiveLocationAdded: ignores if already exists', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION | OBJECT
    `;
    await expectDiffAndPatchToPass(before, after, after);
  });

  /**
   * This is okay because the change is to add another location. It says nothing about whether or not
   * the existing locations are sufficient otherwise.
   */
  test('directiveLocationAdded: passes if already exists with a different location', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION | OBJECT
    `;
    const patchTarget = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION | INTERFACE
    `;
    await expectDiffAndPatchToPass(before, after, patchTarget);
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

  test('directiveArgumentDefaultValueChanged: throws if old default value does not match schema', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String = "It tastes good.") on FIELD_DEFINITION
    `;
    const patchTarget = /* GraphQL */ `
      scalar Food
      directive @tasty(reason: String = "Flavertown") on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
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

  test('directiveDescriptionChanged: throws if old description does not match schema', async () => {
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
    const patchTarget = /* GraphQL */ `
      scalar Food
      """
      I change this
      """
      directive @tasty(reason: String) on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
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

  test('directiveArgumentTypeChanged: throws if old argument type does not match schema', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(scale: Int) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(scale: Int!) on FIELD_DEFINITION
    `;
    const patchTarget = /* GraphQL */ `
      scalar Food
      directive @tasty(scale: String!) on FIELD_DEFINITION
    `;
    await expectDiffAndPatchToThrow(before, after, patchTarget);
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

  test('directiveRepeatableAdded: throws if directive does not exist in patched schema', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty(scale: Int!) on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty(scale: Int!) repeatable on FIELD_DEFINITION
    `;
    const patchSchema = /* GraphQL */ `
      scalar Food
    `;
    await expectDiffAndPatchToThrow(before, after, patchSchema);
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

  test('directiveRepeatableRemoved: ignores if directive does not exist in patched schema', async () => {
    const before = /* GraphQL */ `
      directive @tasty(scale: Int!) repeatable on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      directive @tasty(scale: Int!) on FIELD_DEFINITION
    `;
    const patchTarget = /* GraphQL */ `
      scalar Foo
    `;
    await expectDiffAndPatchToPass(before, after, patchTarget);
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

  test('Definition and Repeated Usage Added', async () => {
    const before = /* GraphQL */ `
      type Pancake {
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
});
