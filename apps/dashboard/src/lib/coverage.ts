// Below half of portfolio weight a 4P multiple still renders, greyed, with a
// "low coverage" label (docs/spec.md §3.3, Definitions #12). Below a quarter
// the API withholds the multiple itself, so that tier arrives as null.
export const LOW_COVERAGE_THRESHOLD = 0.5;

export type CoverageTier = 'full' | 'low' | 'missing';

type CoveredValue = {
  coverageWeight: number;
  multiple: number | null | undefined;
};

// Which of the three ways a multiple renders: as is, greyed, or as a dash.
// Grey and dash are deliberately distinct states and never collapse.
export function coverageTier({
  coverageWeight,
  multiple,
}: CoveredValue): CoverageTier {
  if (multiple == null) return 'missing';
  return coverageWeight < LOW_COVERAGE_THRESHOLD ? 'low' : 'full';
}
