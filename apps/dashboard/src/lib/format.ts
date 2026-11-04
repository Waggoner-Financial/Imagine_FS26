// Formatting for the dashboard's figures. The API sends fractions (0.0251
// means 2.51 %), dollars, and dates as YYYY-MM-DD strings. A figure the API
// could not compute arrives as null and renders as an em dash, never as 0.

export const MISSING = '—';

const percent = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'percent',
});

const signedPercent = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: 'exceptZero',
  style: 'percent',
});

const compactPercent = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  style: 'percent',
});

const signedCompactPercent = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: 'exceptZero',
  style: 'percent',
});

const percentagePoints = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: 'exceptZero',
});

// Compact dollars with four significant digits: 184300000 -> "$184.3M".
const money = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumSignificantDigits: 4,
  notation: 'compact',
  style: 'currency',
});

const signedMoney = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumSignificantDigits: 4,
  notation: 'compact',
  signDisplay: 'exceptZero',
  style: 'currency',
});

const price = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
});

const count = new Intl.NumberFormat('en-US');

// Dates are formatted in UTC. Parsing "2026-09-01" yields midnight UTC, which
// in any timezone west of Greenwich is still August 31 in local time.
const date = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

const dayLabel = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

const monthLabel = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
});

const MS_PER_DAY = 86_400_000;
// Windows up to about three months (1D, 1M, a recent trade date) label ticks
// by day; anything longer spans enough months, or crosses a year boundary,
// that the label needs the year instead.
const DAY_LABEL_MAX_DAYS = 92;

export function formatPercent(fraction: number | null | undefined): string {
  return fraction == null ? MISSING : percent.format(fraction);
}

/** Like formatPercent, with an explicit + for gains, e.g. "+2.51%". */
export function formatSignedPercent(
  fraction: number | null | undefined
): string {
  return fraction == null ? MISSING : signedPercent.format(fraction);
}

/** A compact weight, such as 0.12 -> "12%". */
export function formatCompactPercent(
  fraction: number | null | undefined
): string {
  return fraction == null ? MISSING : compactPercent.format(fraction);
}

/** A compact signed return, such as 0.267 -> "+26.7%". */
export function formatSignedCompactPercent(
  fraction: number | null | undefined
): string {
  return fraction == null ? MISSING : signedCompactPercent.format(fraction);
}

/** A fractional contribution expressed in percentage points. */
export function formatPercentagePoints(
  fraction: number | null | undefined
): string {
  return fraction == null ? MISSING : percentagePoints.format(fraction * 100);
}

/** A security price with two decimal places. */
export function formatPrice(dollars: number | null | undefined): string {
  return dollars == null ? MISSING : price.format(dollars);
}

export function formatMoney(dollars: number | null | undefined): string {
  return dollars == null ? MISSING : money.format(dollars);
}

/** Like formatMoney, with an explicit + for gains, e.g. "+$2.15M". */
export function formatSignedMoney(dollars: number | null | undefined): string {
  return dollars == null ? MISSING : signedMoney.format(dollars);
}

export function formatCount(value: number): string {
  return count.format(value);
}

/** "2026-09-01" -> "Sep 1, 2026". */
export function formatDate(isoDate: string | null | undefined): string {
  if (isoDate == null || isoDate === '') return MISSING;
  return date.format(new Date(`${isoDate}T00:00:00Z`));
}

// Builds the x-axis tick formatter for one window: "Aug 13" for windows up to
// about three months, "Mar 2021" for longer ones, so a 1Y axis never shows
// the same "Sep 1" for two different years. The span is measured once here
// rather than on every tick.
export function axisDateFormatter(
  windowStart: string,
  asOf: string
): (isoDate: string) => string {
  const spanDays =
    (Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${windowStart}T00:00:00Z`)) /
    MS_PER_DAY;
  const format = spanDays > DAY_LABEL_MAX_DAYS ? monthLabel : dayLabel;
  return (isoDate) => format.format(new Date(`${isoDate}T00:00:00Z`));
}

const multiple = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const zScore = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

const ordinal = new Intl.PluralRules('en-US', { type: 'ordinal' });

const ORDINAL_SUFFIXES: Record<Intl.LDMLPluralRule, string> = {
  few: 'rd',
  many: 'th',
  one: 'st',
  other: 'th',
  two: 'nd',
  zero: 'th',
};

/** A valuation multiple, such as 6.8 -> "6.8×". */
export function formatMultiple(value: number | null | undefined): string {
  return value == null ? MISSING : `${multiple.format(value)}×`;
}

/** A percentile given as a fraction, such as 0.82 -> "82nd". */
export function formatPercentile(fraction: number | null | undefined): string {
  if (fraction == null) return MISSING;
  const rank = Math.round(fraction * 100);
  return `${rank}${ORDINAL_SUFFIXES[ordinal.select(rank)]}`;
}

/** A z-score with an explicit sign, such as 1.1 -> "+1.1". */
export function formatZScore(value: number | null | undefined): string {
  return value == null ? MISSING : zScore.format(value);
}

const driftPp = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

export function formatDriftPp(value: number | null | undefined): string {
  return value == null ? MISSING : `${driftPp.format(value)} pp`;
}

/** An attribution share with its sign, or the API's reason in its place. */
export function formatShare(
  share: number | null | undefined,
  reason: string | null | undefined
): string {
  return share == null ? (reason ?? MISSING) : formatSignedPercent(share);
}
