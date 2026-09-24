import { createSchema, createYoga } from 'graphql-yoga';

import typeDefs from '../schema.graphql' with { type: 'text' };
import { resolvers } from './resolvers';

// Serves POST/GET /graphql, plus GraphiQL (an in-browser query editor) when
// /graphql is opened in a browser, and /health for the host's health check.
// Exported separately from main.ts so tests can send requests to it without
// opening a network port.
export const yoga = createYoga({
  graphiql: { title: 'Portfolio Dashboard mock API' },
  schema: createSchema({ resolvers, typeDefs }),
});

// Routes one request. The bare domain redirects to the GraphQL endpoint, so a
// URL shared without its path still lands on GraphiQL instead of a 404; every
// other path goes to Yoga. The redirect is temporary (302) so browsers do not
// cache it if something is ever served at the root.
//
// The Location is relative on purpose. Behind a host's TLS proxy the server
// sees plain http, so an absolute URL built from the request would send
// visitors from https to http; a relative one keeps whatever scheme and host
// the browser used.
export function handleRequest(request: Request): Response | Promise<Response> {
  if (new URL(request.url).pathname === '/') {
    return new Response(null, {
      headers: { location: yoga.graphqlEndpoint },
      status: 302,
    });
  }
  return yoga.fetch(request);
}
