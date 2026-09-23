import type { CodegenConfig } from '@graphql-codegen/cli';

// Generates resolver types from schema.graphql, so the resolvers are checked
// against the contract at compile time. Run `moonx mock-api:codegen` after
// editing the schema, and commit the result — CI fails if it is stale.
const config: CodegenConfig = {
  schema: 'schema.graphql',
  generates: {
    'src/generated/resolvers-types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        // Plain string unions, so the const-object enums in
        // @imagine/mock-data are assignable to the generated types.
        enumsAsTypes: true,
        useTypeImports: true,
      },
    },
  },
};

export default config;
