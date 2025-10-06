import { parse, print, Source } from 'graphql';
import { LoadersRegistry } from '@graphql-inspector/loaders';
import { validate } from '../../src/index.js';

describe('aws', () => {
  test('should accept AWS Appsync types', async () => {
    const doc = parse(/* GraphQL */ `
      query getPost {
        data {
          normalScalar
          date
          time
          dateTime
          timestamp
          email
          json
          url
          phone
          ipAddress
        }
      }
    `);

    const schema = await new LoadersRegistry().loadSchema(
      /* GraphQL */ `
        type AWS_Data @aws_lambda {
          normalScalar: String
          date: AWSDate!
          time: AWSTime!
          dateTime: AWSDateTime!
          timestamp: AWSTimestamp!
          email: AWSEmail!
          json: AWSJSON!
          url: AWSURL!
          phone: AWSPhone!
          ipAddress: AWSIPAddress!
        }

        type Query {
          data: AWS_Data @aws_lambda
        }
      `,
      {},
      false,
      false,
      true,
    );

    const results = validate(schema, [new Source(print(doc))]);

    expect(results).toHaveLength(0);
  });
});
