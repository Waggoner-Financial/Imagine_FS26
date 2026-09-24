import { handleRequest } from './server';

const DEFAULT_PORT = 4000;

// Hosts such as Railway assign the port through the PORT environment variable.
const port = Number(process.env.PORT ?? DEFAULT_PORT);

const server = Bun.serve({ fetch: handleRequest, port });

console.info(`Mock API ready at ${new URL('/graphql', server.url).href}`);
