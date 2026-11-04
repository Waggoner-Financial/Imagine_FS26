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

const count = new Intl.NumberFormat('en-US');

// Dates are formatted in UTC. Parsing "2026-09-01" yields midnight UTC, which
// in any timezone west of Greenwich is still August 31 in local time.
const date = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function formatPercent(fraction: number | null | undefined): string {
  return fraction == null ? MISSING : percent.format(fraction);
}

/** Like formatPercent, with an explicit + for gains, e.g. "+2.51%". */
export function formatSignedPercent(
  fraction: number | null | undefined
): string {
  return fraction == null ? MISSING : signedPercent.format(fraction);
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
