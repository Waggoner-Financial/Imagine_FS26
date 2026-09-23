// Lets TypeScript accept `import typeDefs from '../schema.graphql'`. Bun loads
// the file as a string at runtime, and `bun build` inlines it into the bundle.
declare module '*.graphql' {
  const source: string;
  export default source;
}
