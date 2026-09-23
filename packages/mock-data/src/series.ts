import { roundTo } from './derive';

/**
 * The server downsamples; the client never thins a series (Definitions #14).
 * 260 is one weekly point per year over a five-year ALL window.
 */
export const MAX_SERIES_POINTS = 260;

const MS_PER_DAY = 86_400_000;
const SATURDAY = 6;
const SUNDAY = 0;
const VALUE_DECIMALS = 6;

/** Linear congruential generator constants (Numerical Recipes). */
const LCG_MULTIPLIER = 1_664_525;
const LCG_INCREMENT = 1_013_904_223;
const LCG_MODULUS = 2 ** 32;

/** FNV-1a constants, for turning a series key into a stable seed. */
const FNV_OFFSET_BASIS = 2_166_136_261;
const FNV_PRIME = 16_777_619;

export type SeriesPointData = {
  date: string;
  value: number;
};

const seedFrom = (key: string): number => {
  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
};

const createRandom = (seed: number): (() => number) => {
  let state = seed;
  return (): number => {
    state = (Math.imul(state, LCG_MULTIPLIER) + LCG_INCREMENT) >>> 0;
    return state / LCG_MODULUS;
  };
};

/** Weekday dates from start to end inclusive, as YYYY-MM-DD. */
export const tradingDays = (start: string, end: string): string[] => {
  const days: string[] = [];
  const endTime = Date.parse(`${end}T00:00:00Z`);
  let cursor = Date.parse(`${start}T00:00:00Z`);

  while (cursor <= endTime) {
    const date = new Date(cursor);
    const weekday = date.getUTCDay();
    if (weekday !== SATURDAY && weekday !== SUNDAY) {
      days.push(date.toISOString().slice(0, 10));
    }
    cursor += MS_PER_DAY;
  }

  return days;
};

/**
 * A random walk starting at 0 with its endpoint pinned to endValue: the raw
 * walk's closing drift is removed linearly, which leaves both ends exact.
 * Seeded rather than random, so the same request always returns the same
 * numbers — determinism matters more than realism for sample data.
 */
const pinnedWalk = (
  length: number,
  endValue: number,
  volatility: number,
  random: () => number
): number[] => {
  if (length === 0) return [];
  if (length === 1) return [endValue];

  const raw: number[] = [0];
  for (let index = 1; index < length; index += 1) {
    raw.push(raw[index - 1] + (random() - 0.5) * volatility);
  }

  const drift = raw[length - 1] - endValue;
  return raw.map((value, index) => value - (drift * index) / (length - 1));
};

/**
 * Keeps every stride-th point and always the last one, so a series never loses
 * the endpoint the panels reconcile against.
 */
export const downsample = (
  points: SeriesPointData[],
  maxPoints: number
): SeriesPointData[] => {
  if (points.length <= maxPoints) return points;

  const stride = Math.ceil(points.length / maxPoints);
  const sampled = points.filter((_point, index) => index % stride === 0);
  const last = points[points.length - 1];

  if (sampled[sampled.length - 1].date !== last.date) sampled.push(last);

  return sampled;
};

export const buildSeries = (
  seedKey: string,
  windowStart: string,
  asOf: string,
  endValue: number,
  volatility: number
): SeriesPointData[] => {
  const days = tradingDays(windowStart, asOf);
  const random = createRandom(seedFrom(seedKey));
  const values = pinnedWalk(days.length, endValue, volatility, random);
  const points = days.map((date, index) => ({
    date,
    value: roundTo(values[index], VALUE_DECIMALS),
  }));

  return downsample(points, MAX_SERIES_POINTS);
};

/** Calendar shift on a YYYY-MM-DD date, used to anchor horizon windows. */
export const shiftDate = (
  date: string,
  years: number,
  months: number,
  days: number
): string => {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCFullYear(shifted.getUTCFullYear() + years);
  shifted.setUTCMonth(shifted.getUTCMonth() + months);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
};
