type GraphQLResponse<T> = {
  data?: T | null;
  errors?: { message: string }[];
};

// Turns a parsed GraphQL response body into its data, or throws an Error
// carrying the first GraphQL error message. React Query shows a thrown error
// as the card's error state, so the user reads e.g. "Unknown portfolio p-nope"
// instead of a blank card.
export function unwrapResponse<T>(status: number, body: unknown): T {
  if (typeof body !== 'object' || body === null) {
    throw new Error(`Unexpected response from the API (HTTP ${status})`);
  }
  const result = body as GraphQLResponse<T>;
  const firstError = result.errors?.[0];
  if (firstError !== undefined) throw new Error(firstError.message);
  if (result.data == null) {
    throw new Error(`The API returned no data (HTTP ${status})`);
  }
  return result.data;
}
