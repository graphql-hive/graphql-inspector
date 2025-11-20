import { GraphQLSchema } from 'graphql';
import { Change } from '../changes/change.js';

export type Rule<TConfig = any> = (input: {
  changes: Change[];
  oldSchema: GraphQLSchema | null;
  newSchema: GraphQLSchema | null;
  config: TConfig;
}) => Change[] | Promise<Change[]>;
