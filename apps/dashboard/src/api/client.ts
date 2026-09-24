import type { TypedDocumentString } from '../generated/graphql';
import { unwrapResponse } from './response';

const HOSTED_API_URL =
  'https://imaginemock-api-production.up.railway.app/graphql';

// The hosted mock API unless VITE_API_URL says otherwise. To use a mock API
// running on your machine, put this in apps/dashboard/.env.local:
//   VITE_API_URL=http://localhost:4000/graphql
const configuredUrl = import.meta.env.VITE_API_URL;
export const API_URL: string =
  configuredUrl !== undefined && configuredUrl !== ''
    ? configuredUrl
    : HOSTED_API_URL;

// Sends one query and returns its data. The generated documents carry their
// result and variable types, so callers get typed data with no casts, and a
// query that takes variables cannot be called without them.
export async function execute<TResult, TVariables>(
  document: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
  const response = await fetch(API_URL, {
    body: JSON.stringify({ query: document, variables }),
    headers: {
      accept: 'application/graphql-response+json, application/json',
      'content-type': 'application/json',
    },
    method: 'POST',
  });
  return unwrapResponse<TResult>(response.status, await response.json());
}
