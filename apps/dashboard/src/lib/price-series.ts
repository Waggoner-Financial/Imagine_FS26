import type { SeriesKind } from '../generated/graphql';

// Helpers for the Price Action chart (spec §3.2). The API sends each line as
// its own list of points, all rebased to 0 at the window start and already
// downsampled by the server; nothing here thins or re-bases a series.

export type ChartSeries = {
  id: string;
  points: readonly { date: string; value: number }[];
};

/** One x-axis position: a date plus each series' value on that date. */
export type ChartRow = { date: string } & Record<string, number | string>;

// Merges every series into one row per date, sorted by date, because
// Recharts plots one array of rows. Rows are matched by date rather than by
// array position, so a series missing a date simply leaves its key unset.
export function toChartRows(series: readonly ChartSeries[]): ChartRow[] {
  const rows = new Map<string, ChartRow>();
  for (const line of series) {
    for (const point of line.points) {
      const row: ChartRow = rows.get(point.date) ?? { date: point.date };
      row[line.id] = point.value;
      rows.set(point.date, row);
    }
  }
  return [...rows.values()].toSorted((a, b) => a.date.localeCompare(b.date));
}

/** Where a line ends, or null for a series with no points. */
export function lastValue(series: ChartSeries): number | null {
  return series.points.at(-1)?.value ?? null;
}

// How each kind of line is drawn. Colors are CSS custom properties from
// styles.css, so they follow dark mode; the dash patterns keep the lines
// distinguishable without relying on color alone (spec §6).
export const SERIES_STYLE: Record<
  SeriesKind,
  { color: string; dash?: string }
> = {
  BENCHMARK: { color: 'var(--series-benchmark)', dash: '6 4' },
  INDEX: { color: 'var(--series-index)', dash: '2 3' },
  PORTFOLIO: { color: 'var(--series-portfolio)' },
};
