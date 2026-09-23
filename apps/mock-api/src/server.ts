import { createSchema, createYoga } from 'graphql-yoga';

import typeDefs from '../schema.graphql' with { type: 'text' };
import { resolvers } from './resolvers';

// Serves POST/GET /graphql, plus GraphiQL (an in-browser query editor) when
// /graphql is opened in a browser. Exported separately from main.ts so tests
// can send requests to it without opening a network port.
export const yoga = createYoga({
  graphiql: { title: 'Portfolio Dashboard mock API' },
  schema: createSchema({ resolvers, typeDefs }),
});
