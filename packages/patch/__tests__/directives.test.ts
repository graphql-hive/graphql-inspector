import { parse, print } from 'graphql';
import { Change } from '@graphql-inspector/core';
import { errors, patch } from '../src/index.js';
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

  test('Definition and Repeated Usage Added: Federated directives', async () => {
    const before = /* GraphQL */ `
      schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key"]) {
        query: Query
      }
      type Query {
        pancake(id: ID!): Pancake
      }
      type Pancake @key(fields: "id") {
        id: ID!
        radius: Int!
      }
    `;
    const after = /* GraphQL */ `
      schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key"]) {
        query: Query
      }
      type Query {
        pancake(id: ID!): Pancake
      }
      scalar FieldSet
      directive @key(fields: FieldSet!, resolvable: Boolean) repeatable on INTERFACE | OBJECT

      directive @flavor(flavor: String!) repeatable on OBJECT
      type Pancake
        @key(fields: "id")
        @flavor(flavor: "sweet")
        @flavor(flavor: "bread")
        @flavor(flavor: "chocolate")
        @flavor(flavor: "strawberry")
        @key(fields: "invoice") {
        id: ID!
        invoid: ID
        radius: Int!
      }
    `;
    await expectDiffAndPatchToMatch(before, after);
  });

  test('Schema Extensions can be used with directives', async () => {
    const before = `
      extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key", "@external"]) @link(url: "https://specs.graphql-hive.com/hive/v1.0", import: ["@meta"]) @meta(name: "owner", content: "notifications-team") @meta(name: "contact", content: "#notifications-channel")

      directive @meta(name: String!, content: String!) repeatable on SCHEMA | OBJECT | INTERFACE | FIELD_DEFINITION

      """ ISO-8601 formatted date and time string """
      scalar DateTime

      """ Types of notifications that can be sent to users """
      enum NotificationType {
        """ Notification about a product update """
        PRODUCT_UPDATE
        """ Notification when a new review is posted """
        REVIEW_POSTED
        """ Welcome notification for new users """
        WELCOME
      }

      """ Filter criteria for searching notifications """
      input NotificationFilterInput {
        """ Search text to match against notification messages """
        searchText: String
        """ Filter by specific notification types """
        types: [NotificationType!]
        """ Only include notifications from this date onwards """
        dateFrom: DateTime
        """ Only include notifications up to this date """
        dateTo: DateTime
      }

      """ Base interface for all notification types """
      interface NotificationItf @meta(name: "domain", content: "notifications") {
        id: ID!
        message: String!
      }

      """ Notification sent when a product is updated """
      type ProductUpdateNotification implements NotificationItf {
        """ Unique identifier for the notification """
        id: ID!
        """ Human-readable notification message """
        message: String!
        """ The product that was updated """
        product: Product!
        """ Timestamp when the product was updated """
        updatedAt: DateTime!
      }

      """ Notification sent when a review is posted """
      type ReviewPostedNotification implements NotificationItf {
        """ Unique identifier for the notification """
        id: ID!
        """ Human-readable notification message """
        message: String!
        """ The review that was posted """
        review: Review!
        """ Timestamp when the review was posted """
        postedAt: DateTime!
      }

      """ Welcome notification sent to new users """
      type WelcomeNotification implements NotificationItf {
        """ Unique identifier for the notification """
        id: ID!
        """ Human-readable notification message """
        message: String!
        """ Timestamp when the notification was created """
        createdAt: DateTime!
      }

      """ Union of all possible notification types """
      union Notification = ProductUpdateNotification | ReviewPostedNotification | WelcomeNotification

      extend type User @key(fields: "id") {
        """ Unique identifier for the user """
        id: ID! @external
        """ List of all notifications for this user """
        notifications: [Notification!]!
      }

      extend type Product @key(fields: "upc") {
        """ Universal Product Code """
        upc: String!
      }

      """ Review stub reference (full definition in reviews subgraph) """
      type Review @key(fields: "id") {
        """ Unique identifier for the review """
        id: ID!
      }

      extend type Query {
        notification(
          """ Unique identifier of the notification to retrieve """
          id: ID!
        ): Notification
        notifications: [Notification!]!
        searchNotifications(
          """ Filter criteria including search text, notification types, and date range 
          """
          filter: NotificationFilterInput!
        ): [Notification!]!
      }
    `;

    const changes: Change<any>[] = [
      {
        id: '863af8343aa3449d9ae366f6b8b1ba56',
        type: 'SCHEMA_MUTATION_TYPE_CHANGED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message: "Schema mutation type was set to 'Mutation'.",
        meta: { oldMutationTypeName: null, newMutationTypeName: 'Mutation' },
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
      {
        id: '33288050d0d5485af5a17eca23745296',
        type: 'TYPE_ADDED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message: "Type 'Mutation' was added",
        meta: { addedTypeName: 'Mutation', addedTypeKind: 'ObjectTypeDefinition' },
        path: 'Mutation',
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
      {
        id: '40657e0e6df54054030c5dd0a6b15563',
        type: 'FIELD_ADDED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message: "Field 'sendWelcomeNotification' was added to object type 'Mutation'",
        meta: {
          typeName: 'Mutation',
          addedFieldName: 'sendWelcomeNotification',
          typeType: 'object type',
          addedFieldReturnType: 'SendWelcomeNotificationResult!',
        },
        path: 'Mutation.sendWelcomeNotification',
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
      {
        id: 'e532b07b1917169470d3a108f1c1db62',
        type: 'FIELD_ARGUMENT_ADDED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message:
          "Argument 'input: SendWelcomeNotificationInput!' added to field 'Mutation.sendWelcomeNotification'",
        meta: {
          typeName: 'Mutation',
          fieldName: 'sendWelcomeNotification',
          addedArgumentName: 'input',
          addedArgumentType: 'SendWelcomeNotificationInput!',
          hasDefaultValue: false,
          isAddedFieldArgumentBreaking: true,
          addedToNewField: true,
        },
        path: 'Mutation.sendWelcomeNotification.input',
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
      {
        id: 'fbf213a214669679098542fdaaf65954',
        type: 'TYPE_ADDED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message: "Type 'SendWelcomeNotificationInput' was added",
        meta: {
          addedTypeName: 'SendWelcomeNotificationInput',
          addedTypeKind: 'InputObjectTypeDefinition',
          addedTypeIsOneOf: false,
        },
        path: 'SendWelcomeNotificationInput',
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
      {
        id: 'e069b3c226ce25dfb5d8fc2e18fb8396',
        type: 'INPUT_FIELD_ADDED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message:
          "Input field 'message' of type 'String!' was added to input object type 'SendWelcomeNotificationInput'",
        meta: {
          inputName: 'SendWelcomeNotificationInput',
          addedInputFieldName: 'message',
          isAddedInputFieldTypeNullable: false,
          addedInputFieldType: 'String!',
          addedToNewType: true,
        },
        path: 'SendWelcomeNotificationInput.message',
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
      {
        id: '98908a34ac82537a63b5ce99c6f1e3ad',
        type: 'TYPE_ADDED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message: "Type 'SendWelcomeNotificationResult' was added",
        meta: {
          addedTypeName: 'SendWelcomeNotificationResult',
          addedTypeKind: 'ObjectTypeDefinition',
        },
        path: 'SendWelcomeNotificationResult',
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
      {
        id: 'bc885faacb0d0704e058b63e6159987f',
        type: 'FIELD_ADDED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message: "Field 'error' was added to object type 'SendWelcomeNotificationResult'",
        meta: {
          typeName: 'SendWelcomeNotificationResult',
          addedFieldName: 'error',
          typeType: 'object type',
          addedFieldReturnType: 'WelcomeNotificationError',
        },
        path: 'SendWelcomeNotificationResult.error',
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
      {
        id: '2ce0ab340c5aa2791ba280a36a79a855',
        type: 'FIELD_ADDED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message: "Field 'ok' was added to object type 'SendWelcomeNotificationResult'",
        meta: {
          typeName: 'SendWelcomeNotificationResult',
          addedFieldName: 'ok',
          typeType: 'object type',
          addedFieldReturnType: 'WelcomeNotification',
        },
        path: 'SendWelcomeNotificationResult.ok',
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
      {
        id: '4a61590da95c680f4fba49a79b4f6621',
        type: 'TYPE_ADDED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message: "Type 'WelcomeNotificationError' was added",
        meta: { addedTypeName: 'WelcomeNotificationError', addedTypeKind: 'ObjectTypeDefinition' },
        path: 'WelcomeNotificationError',
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
      {
        id: 'f7cb114109fbfe6dcd137ccfdafb4e35',
        type: 'FIELD_ADDED',
        approvalMetadata: null,
        criticality: { level: 'NON_BREAKING' },
        message: "Field 'message' was added to object type 'WelcomeNotificationError'",
        meta: {
          typeName: 'WelcomeNotificationError',
          addedFieldName: 'message',
          typeType: 'object type',
          addedFieldReturnType: 'String!',
        },
        path: 'WelcomeNotificationError.message',
        isSafeBasedOnUsage: false,
        reason: null,
        usageStatistics: null,
        affectedAppDeployments: null,
        breakingChangeSchemaCoordinate: null,
      },
    ];

    expect(print(patch(parse(before), changes, { onError: errors.looseErrorHandler })))
      .toMatchInlineSnapshot(`
        "extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key", "@external"]) @link(url: "https://specs.graphql-hive.com/hive/v1.0", import: ["@meta"]) @meta(name: "owner", content: "notifications-team") @meta(name: "contact", content: "#notifications-channel") {
          mutation: Mutation
        }

        directive @meta(name: String!, content: String!) repeatable on SCHEMA | OBJECT | INTERFACE | FIELD_DEFINITION

        """ ISO-8601 formatted date and time string """
        scalar DateTime

        """ Types of notifications that can be sent to users """
        enum NotificationType {
          """ Notification about a product update """
          PRODUCT_UPDATE
          """ Notification when a new review is posted """
          REVIEW_POSTED
          """ Welcome notification for new users """
          WELCOME
        }

        """ Filter criteria for searching notifications """
        input NotificationFilterInput {
          """ Search text to match against notification messages """
          searchText: String
          """ Filter by specific notification types """
          types: [NotificationType!]
          """ Only include notifications from this date onwards """
          dateFrom: DateTime
          """ Only include notifications up to this date """
          dateTo: DateTime
        }

        """ Base interface for all notification types """
        interface NotificationItf @meta(name: "domain", content: "notifications") {
          id: ID!
          message: String!
        }

        """ Notification sent when a product is updated """
        type ProductUpdateNotification implements NotificationItf {
          """ Unique identifier for the notification """
          id: ID!
          """ Human-readable notification message """
          message: String!
          """ The product that was updated """
          product: Product!
          """ Timestamp when the product was updated """
          updatedAt: DateTime!
        }

        """ Notification sent when a review is posted """
        type ReviewPostedNotification implements NotificationItf {
          """ Unique identifier for the notification """
          id: ID!
          """ Human-readable notification message """
          message: String!
          """ The review that was posted """
          review: Review!
          """ Timestamp when the review was posted """
          postedAt: DateTime!
        }

        """ Welcome notification sent to new users """
        type WelcomeNotification implements NotificationItf {
          """ Unique identifier for the notification """
          id: ID!
          """ Human-readable notification message """
          message: String!
          """ Timestamp when the notification was created """
          createdAt: DateTime!
        }

        """ Union of all possible notification types """
        union Notification = ProductUpdateNotification | ReviewPostedNotification | WelcomeNotification

        extend type User @key(fields: "id") {
          """ Unique identifier for the user """
          id: ID! @external
          """ List of all notifications for this user """
          notifications: [Notification!]!
        }

        extend type Product @key(fields: "upc") {
          """ Universal Product Code """
          upc: String!
        }

        """ Review stub reference (full definition in reviews subgraph) """
        type Review @key(fields: "id") {
          """ Unique identifier for the review """
          id: ID!
        }

        extend type Query {
          notification(
            """ Unique identifier of the notification to retrieve """
            id: ID!
          ): Notification
          notifications: [Notification!]!
          searchNotifications(
            """ Filter criteria including search text, notification types, and date range 
            """
            filter: NotificationFilterInput!
          ): [Notification!]!
        }

        type Mutation {
          sendWelcomeNotification(input: SendWelcomeNotificationInput!): SendWelcomeNotificationResult!
        }

        input SendWelcomeNotificationInput {
          message: String!
        }

        type SendWelcomeNotificationResult {
          error: WelcomeNotificationError
          ok: WelcomeNotification
        }

        type WelcomeNotificationError {
          message: String!
        }"
      `);
  });
});
