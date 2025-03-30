import { buildSchema, GraphQLSchema } from 'graphql';
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

  loadSchema(
    pointer: string,
    options: Omit<LoadSchemaOptions, 'loaders'> = {},
    enableApolloFederation: boolean,
    enableAWS: boolean,
  ): Promise<GraphQLSchema> {
    return enrichError(
      loadSchema(pointer, {
        loaders: this.loaders,
        ...options,
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
