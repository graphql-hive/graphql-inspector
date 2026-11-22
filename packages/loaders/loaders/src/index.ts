import { buildSchema, GraphQLSchema, isInterfaceType, isObjectType, printSchema } from 'graphql';
import { InspectorConfig } from '@graphql-inspector/config';
import {
  loadDocuments,
  loadSchema,
  LoadSchemaOptions,
  LoadTypedefsOptions,
} from '@graphql-tools/load';
import { Loader, Source } from '@graphql-tools/utils';

export class LoadersRegistry {
  private loaders: Loader[] = [];

  register(loader: Loader) {
    this.loaders.push(loader);
  }

  registerModule(loaderName: string) {
    try {
      const loader: Loader = loadModule(`@graphql-inspector/${loaderName}-loader`);

      this.register(loader);
    } catch (error) {
      console.error(error);
      throw new Error(`Couldn't load ${loaderName} loader`);
    }
  }

  async loadSchema(
    pointer: string,
    options: Omit<LoadSchemaOptions, 'loaders'> = {},
    enableApolloFederation: boolean,
    enableApolloFederationV2: boolean,
    enableAWS: boolean,
  ): Promise<GraphQLSchema> {
    const schema = await enrichError(
      loadSchema(pointer, {
        loaders: this.loaders,
        ...options,
        ...(enableApolloFederationV2
          ? {
              schemas: [
                buildSchema(/* GraphQL */ `
                  scalar _Any
                  union _Entity
                  scalar FieldSet
                  scalar link__Import
                  scalar federation__ContextFieldValue
                  scalar federation__Scope
                  scalar federation__Policy

                  type Query

                  enum link__Purpose {
                    SECURITY
                    EXECUTION
                  }

                  type _Service {
                    sdl: String!
                  }

                  extend type Query {
                    _entities(representations: [_Any!]!): [_Entity]!
                    _service: _Service!
                  }

                  directive @external on FIELD_DEFINITION | OBJECT
                  directive @requires(fields: FieldSet!) on FIELD_DEFINITION
                  directive @provides(fields: FieldSet!) on FIELD_DEFINITION
                  directive @key(
                    fields: FieldSet!
                    resolvable: Boolean = true
                  ) repeatable on OBJECT | INTERFACE
                  directive @link(
                    url: String!
                    as: String
                    for: link__Purpose
                    import: [link__Import]
                  ) repeatable on SCHEMA
                  directive @shareable repeatable on OBJECT | FIELD_DEFINITION
                  directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
                  directive @tag(
                    name: String!
                  ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
                  directive @override(from: String!) on FIELD_DEFINITION
                  directive @composeDirective(name: String!) repeatable on SCHEMA
                  directive @interfaceObject on OBJECT
                  directive @authenticated on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
                  directive @requiresScopes(
                    scopes: [[federation__Scope!]!]!
                  ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
                  directive @policy(
                    policies: [[federation__Policy!]!]!
                  ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
                  directive @context(name: String!) repeatable on INTERFACE | OBJECT | UNION
                  directive @fromContext(
                    field: federation__ContextFieldValue
                  ) on ARGUMENT_DEFINITION
                  directive @extends on OBJECT | INTERFACE
                `),
              ],
            }
          : {}),
        ...(enableApolloFederation
          ? {
              schemas: [
                buildSchema(/* GraphQL */ `
                  scalar _FieldSet
                  directive @external on FIELD_DEFINITION
                  directive @requires(fields: _FieldSet!) on FIELD_DEFINITION
                  directive @provides(fields: _FieldSet!) on FIELD_DEFINITION
                  directive @key(fields: _FieldSet!) on OBJECT | INTERFACE
                  directive @extends on OBJECT | INTERFACE
                `),
              ],
            }
          : {}),
        ...(enableAWS
          ? {
              schemas: [
                buildSchema(/* GraphQL */ `
                  scalar AWSDate
                  scalar AWSTime
                  scalar AWSDateTime
                  scalar AWSTimestamp
                  scalar AWSEmail
                  scalar AWSJSON
                  scalar AWSURL
                  scalar AWSPhone
                  scalar AWSIPAddress
                  scalar BigInt
                  scalar Double

                  directive @deprecated(
                    reason: String = "No longer supported"
                  ) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION

                  """
                  This directive allows results to be deferred during execution
                  """
                  directive @defer on FIELD

                  """
                  Tells the service this field/object has access authorized by an OIDC token.
                  """
                  directive @aws_oidc on OBJECT | FIELD_DEFINITION

                  """
                  Tells the service this field/object has access authorized by a Lambda Authorizer.
                  """
                  directive @aws_lambda on FIELD_DEFINITION | OBJECT

                  """
                  Directs the schema to enforce authorization on a field
                  """
                  directive @aws_auth(
                    """
                    List of cognito user pool groups which have access on this field
                    """
                    cognito_groups: [String]
                  ) on FIELD_DEFINITION

                  """
                  Tells the service which subscriptions will be published to when this mutation is called. This directive is deprecated use @aws_susbscribe directive instead.
                  """
                  directive @aws_publish(
                    """
                    List of subscriptions which will be published to when this mutation is called.
                    """
                    subscriptions: [String]
                  ) on FIELD_DEFINITION

                  """
                  Tells the service this field/object has access authorized by a Cognito User Pools token.
                  """
                  directive @aws_cognito_user_pools(
                    """
                    List of cognito user pool groups which have access on this field
                    """
                    cognito_groups: [String]
                  ) on OBJECT | FIELD_DEFINITION | INPUT_OBJECT

                  """
                  Tells the service which mutation triggers this subscription.
                  """
                  directive @aws_subscribe(
                    """
                    List of mutations which will trigger this subscription when they are called.
                    """
                    mutations: [String]
                  ) on FIELD_DEFINITION

                  """
                  Tells the service this field/object has access authorized by sigv4 signing.
                  """
                  directive @aws_iam on OBJECT | FIELD_DEFINITION | INPUT_OBJECT

                  """
                  Tells the service this field/object has access authorized by an API key.
                  """
                  directive @aws_api_key on OBJECT | FIELD_DEFINITION
                `),
              ],
            }
          : {}),
      }),
    );

    if (enableApolloFederationV2) {
      return this.buildEntityUnion(schema);
    }

    return schema;
  }

  loadDocuments(
    pointer: string,
    options: Omit<LoadTypedefsOptions, 'loaders'> = {},
  ): Promise<Source[]> {
    return enrichError(
      loadDocuments(pointer, {
        loaders: this.loaders,
        ...options,
      }),
    );
  }

  private buildEntityUnion(schema: GraphQLSchema): GraphQLSchema {
    const entityTypes: string[] = [];
    const typeMap = schema.getTypeMap();

    // Find all types with @key directive
    for (const type of Object.values(typeMap)) {
      if (
        (isObjectType(type) || isInterfaceType(type)) &&
        type.astNode?.directives?.some(dir => dir.name.value === 'key')
      ) {
        entityTypes.push(type.name);
      }
    }

    if (entityTypes.length === 0) {
      return schema; // No entities found
    }

    // Create new schema SDL with populated _Entity union
    const entityUnion = `union _Entity = ${entityTypes.join(' | ')}`;

    // Rebuild schema with proper _Entity union
    const schemaSDL = printSchema(schema).replace('union _Entity', entityUnion);

    return buildSchema(schemaSDL);
  }
}

export type Loaders = Pick<LoadersRegistry, 'loadSchema' | 'loadDocuments'>;

export function useLoaders(config: InspectorConfig): Loaders {
  const loaders = new LoadersRegistry();

  for (const loaderName of config.loaders) loaders.registerModule(loaderName);

  return loaders;
}

function loadModule<T>(name: string): T {
  const mod = require(name);

  return mod.default || mod;
}

/**
 * Adds `(source: <file-path>)` suffix to error message if source is available
 */
function enrichError<T>(looksPromising: Promise<T>): Promise<T> {
  return looksPromising.catch(error => {
    if (error.source?.name) {
      error.message = `${error.message} (source: ${error.source?.name})`;
    }
    return Promise.reject(error);
  });
}
