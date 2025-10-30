import { expectPatchToMatch } from './utils.js';

describe('directives', async () => {
  test('directiveAdded', async () => {
    const before = /* GraphQL */ `
      scalar Food
    `;
    const after = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    await expectPatchToMatch(before, after);
  });

  test('directiveRemoved', async () => {
    const before = /* GraphQL */ `
      scalar Food
      directive @tasty on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      scalar Food
    `;
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
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
    await expectPatchToMatch(before, after);
  });

  test('directiveRepeatableRemoved', async () => {
    const before = /* GraphQL */ `
      directive @tasty(scale: Int!) repeatable on FIELD_DEFINITION
    `;
    const after = /* GraphQL */ `
      directive @tasty(scale: Int!) on FIELD_DEFINITION
    `;
    await expectPatchToMatch(before, after);
  });
});
