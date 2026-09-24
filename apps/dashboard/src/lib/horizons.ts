import type { DashboardHorizon } from '../generated/graphql';

export type Option<T extends string> = { label: string; value: T };

// The global horizon toggle (spec §2), in the order the spec lists them.
export const HORIZONS: readonly Option<DashboardHorizon>[] = [
  { label: '1D', value: 'ONE_DAY' },
  { label: '1M', value: 'ONE_MONTH' },
  { label: '1Y', value: 'ONE_YEAR' },
  { label: 'YTD', value: 'YTD' },
  { label: 'All', value: 'ALL' },
  { label: 'Trade', value: 'SINCE_TRADE' },
];

export function isHorizon(value: string): value is DashboardHorizon {
  return HORIZONS.some((option) => option.value === value);
}

export function horizonLabel(value: DashboardHorizon): string {
  return HORIZONS.find((option) => option.value === value)?.label ?? value;
}
