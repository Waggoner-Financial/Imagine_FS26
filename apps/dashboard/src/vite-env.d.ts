// Types for the environment variables the dashboard reads. Vite exposes only
// variables prefixed with VITE_, from .env files or the shell.
interface ImportMetaEnv {
  /** GraphQL endpoint to query. Defaults to the hosted mock API. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
