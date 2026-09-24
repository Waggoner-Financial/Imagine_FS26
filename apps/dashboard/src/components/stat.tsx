import type { ReactNode } from 'react';

type StatProps = {
  label: string;
  /** A second line: a reason for a missing figure, or extra context. */
  note?: string | null;
  value: string;
};

// One labelled figure. Render inside a <dl>.
export function Stat({ label, note, value }: StatProps): ReactNode {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd className="stat-value">{value}</dd>
      {note != null && note !== '' && <dd className="stat-note">{note}</dd>}
    </div>
  );
}
