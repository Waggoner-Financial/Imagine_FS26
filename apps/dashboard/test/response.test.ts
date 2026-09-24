import { describe, expect, test } from 'bun:test';

import { unwrapResponse } from '../src/api/response';

describe('unwrapResponse', () => {
  test('returns the data of a successful response', () => {
    const data = unwrapResponse<{ ok: boolean }>(200, { data: { ok: true } });
    expect(data).toEqual({ ok: true });
  });

  test('throws the first GraphQL error message', () => {
    const body = {
      data: null,
      errors: [{ message: 'Unknown portfolio p-nope' }],
    };
    expect(() => unwrapResponse(200, body)).toThrow('Unknown portfolio p-nope');
  });

  test('throws when a response carries no data', () => {
    expect(() => unwrapResponse(502, {})).toThrow('HTTP 502');
  });

  test('throws when the body is not a GraphQL response', () => {
    expect(() => unwrapResponse(500, 'Bad gateway')).toThrow('HTTP 500');
  });
});
