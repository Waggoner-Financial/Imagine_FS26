import { describe, expect, test } from 'bun:test';

import {
  biggestMove,
  holdingTiles,
  layoutTiles,
  type Tile,
  tileColor,
} from '../src/lib/treemap';

function tile(
  id: string,
  weight: number,
  ret: number | null,
  isCash = false
): Tile {
  return { details: [], id, isCash, label: id, return: ret, title: id, weight };
}

const tiles = [
  tile('A', 0.5, 0.1),
  tile('B', 0.3, -0.2),
  tile('CASH', 0.2, null, true),
];

describe('layoutTiles', () => {
  test('tile area is proportional to weight', () => {
    const placed = layoutTiles(tiles, 100, 100, 0);
    const area = (id: string): number => {
      const t = placed.find((p) => p.id === id);
      return t === undefined ? 0 : (t.x1 - t.x0) * (t.y1 - t.y0);
    };
    expect(area('A')).toBeCloseTo(5000, 3);
    expect(area('B')).toBeCloseTo(3000, 3);
    expect(area('CASH')).toBeCloseTo(2000, 3);
  });

  test('draws nothing before the container has a width', () => {
    expect(layoutTiles(tiles, 0, 320)).toEqual([]);
  });
});

describe('colours', () => {
  test('the scale runs up to the biggest non-cash move', () => {
    expect(biggestMove(tiles)).toBe(0.2);
  });

  test('cash, zero and missing returns stay neutral', () => {
    expect(tileColor(tile('CASH', 0.1, 0.5, true), 0.2)).toBe(
      'var(--tile-neutral)'
    );
    expect(tileColor(tile('X', 0.1, 0), 0.2)).toBe('var(--tile-neutral)');
    expect(tileColor(tile('X', 0.1, null), 0.2)).toBe('var(--tile-neutral)');
  });

  test('gains are green, losses red, deepest at the biggest move', () => {
    expect(tileColor(tile('X', 0.1, 0.1), 0.2)).toContain('var(--up)');
    expect(tileColor(tile('X', 0.1, -0.2), 0.2)).toBe(
      'color-mix(in srgb, var(--down) 65%, var(--tile-neutral))'
    );
  });
});

test('holdings have no vs S&P 500 row, and cash has no link', () => {
  const [nvda, cash] = holdingTiles([
    {
      isCash: false,
      name: 'NVIDIA',
      return: -0.06,
      sector: 'Technology',
      ticker: 'NVDA',
      weight: 0.12,
    },
    {
      isCash: true,
      name: 'Cash',
      return: null,
      sector: 'Cash',
      ticker: 'CASH',
      weight: 0.06,
    },
  ]);
  expect(nvda?.details.map(([label]) => label)).not.toContain('vs S&P 500');
  expect(nvda?.href).toBe('#/stock/NVDA');
  expect(cash?.href).toBeUndefined();
});
