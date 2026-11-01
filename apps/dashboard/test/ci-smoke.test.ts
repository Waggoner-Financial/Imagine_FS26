import { expect, test } from 'bun:test';

test('deliberately failing', () => {
  expect(1 + 1).toBe(3);
});
