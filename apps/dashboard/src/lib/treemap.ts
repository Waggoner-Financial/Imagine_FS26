import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';

import type { SectorWeightsQuery } from '../generated/graphql';
import { formatPercent, formatSignedPercent } from './format';

type Payload = SectorWeightsQuery['portfolioSectorWeights'];

export type Tile = {
  details: [label: string, value: string][];
  href?: string;
  id: string;
  isCash: boolean;
  label: string;
  return: number | null;
  title: string;
  weight: number;
};

export type PlacedTile = Tile & {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

export function sectorTiles(sectors: Payload['sectors']): Tile[] {
  return sectors.map(
    (s): Tile => ({
      details: [
        ['Weight', formatPercent(s.weight)],
        ['Return', formatSignedPercent(s.return)],
        ['vs S&P 500', formatSignedPercent(s.vsBenchmark)],
        ['Holdings', s.holdings.join(', ')],
      ],
      id: s.name,
      isCash: s.isCash,
      label: s.name,
      return: s.return,
      title: s.name,
      weight: s.weight,
    })
  );
}

export function holdingTiles(
  holdings: Payload['holdings'],
  sector?: string
): Tile[] {
  return holdings
    .filter((h) => sector === undefined || h.sector === sector)
    .map(
      (h): Tile => ({
        details: [
          ['Sector', h.sector],
          ['Weight', formatPercent(h.weight)],
          ['Return', formatSignedPercent(h.return)],
        ],
        ...(h.isCash ? {} : { href: `#/stock/${h.ticker}` }),
        id: h.ticker,
        isCash: h.isCash,
        label: h.ticker,
        return: h.return,
        title: `${h.name} (${h.ticker})`,
        weight: h.weight,
      })
    );
}

type Node = { children?: readonly Tile[]; weight?: number };

export function layoutTiles(
  tiles: readonly Tile[],
  width: number,
  height: number,
  gap = 2
): PlacedTile[] {
  if (width <= 0 || tiles.length === 0) return [];

  const root = hierarchy<Node>({ children: tiles })
    .sum((node) => Math.max(node.weight ?? 0, 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const laidOut = treemap<Node>()
    .tile(treemapSquarify)
    .size([width, height])
    .paddingInner(gap)(root);

  return laidOut.leaves().map((leaf) => ({
    ...(leaf.data as Tile),
    x0: leaf.x0,
    x1: leaf.x1,
    y0: leaf.y0,
    y1: leaf.y1,
  }));
}

export function biggestMove(tiles: readonly Tile[]): number {
  let biggest = 0;
  for (const tile of tiles) {
    if (!tile.isCash && tile.return !== null) {
      biggest = Math.max(biggest, Math.abs(tile.return));
    }
  }
  return biggest;
}

export function tileColor(tile: Tile, maxMove: number): string {
  if (
    tile.isCash ||
    tile.return === null ||
    tile.return === 0 ||
    maxMove === 0
  ) {
    return 'var(--tile-neutral)';
  }
  const strength = Math.min(Math.abs(tile.return) / maxMove, 1);
  const hue = tile.return > 0 ? 'var(--up)' : 'var(--down)';
  const mix = Math.round(20 + strength * 45);
  return `color-mix(in srgb, ${hue} ${mix}%, var(--tile-neutral))`;
}
