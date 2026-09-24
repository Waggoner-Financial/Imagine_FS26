import type { ReactNode } from 'react';

import type { Option } from '../lib/horizons';

type SegmentedControlProps<T extends string> = {
  /** Describes the group for screen readers, e.g. "Horizon". */
  label: string;
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  value: T;
};

// A row of mutually exclusive buttons. Used for the global horizon toggle
// and for controls local to one card, like Deployment's gain/loss horizon.
export function SegmentedControl<T extends string>({
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>): ReactNode {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => {
            onChange(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
