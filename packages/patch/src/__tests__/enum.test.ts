import { expectPatchToMatch } from './utils.js';

describe('enumValue', () => {
  test('enumValueRemoved', async () => {
    const before = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
        SUPER_BROKE
      }
    `;
    const after = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('enumValueAdded', async () => {
    const before = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
      }
    `;
    const after = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
        SUPER_BROKE
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('enumValueDeprecationReasonAdded', async () => {
    const before = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
        SUPER_BROKE @deprecated
      }
    `;
    const after = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
        SUPER_BROKE @deprecated(reason: "Error is enough")
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('enumValueDescriptionChanged: Added', async () => {
    const before = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
      }
    `;
    const after = /* GraphQL */ `
      enum Status {
        """
        The status of something.
        """
        SUCCESS
        ERROR
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('enumValueDescriptionChanged: Changed', async () => {
    const before = /* GraphQL */ `
      enum Status {
        """
        Before
        """
        SUCCESS
        ERROR
      }
    `;
    const after = /* GraphQL */ `
      enum Status {
        """
        After
        """
        SUCCESS
        ERROR
      }
    `;
    await expectPatchToMatch(before, after);
  });

  test('enumValueDescriptionChanged: Removed', async () => {
    const before = /* GraphQL */ `
      enum Status {
        """
        Before
        """
        SUCCESS
        ERROR
      }
    `;
    const after = /* GraphQL */ `
      enum Status {
        SUCCESS
        ERROR
      }
    `;
    await expectPatchToMatch(before, after);
  });
});
