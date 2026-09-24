import type { CodegenConfig } from '@graphql-codegen/cli';

// Generates typed documents for the queries written with `graphql(...)` in
// src/, checked against the mock API's schema. Run `moon run dashboard:codegen`
// after adding or changing a query, and commit the result; CI fails if it is
// stale.
const config: CodegenConfig = {
  schema: '../mock-api/schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/generated/**'],
  generates: {
    'src/generated/': {
      preset: 'client',
      config: {
        // Queries are sent as plain strings, so the app needs no GraphQL
        // client library at runtime, only fetch.
        documentMode: 'string',
        enumsAsTypes: true,
        useTypeImports: true,
      },
      presetConfig: { fragmentMasking: false },
    },
  },
};

export default config;
