import type { ReactNode } from 'react';

import { formatDate } from '../lib/format';

type CardProps = {
  /** Controls local to this card, such as its own horizon toggle. */
  actions?: ReactNode;
  asOf?: string | null;
  children?: ReactNode;
  error?: Error | null;
  isLoading?: boolean;
  onRetry?: () => void;
  title: string;
};

// The chrome every panel shares (spec §2): title and local controls on top,
// the body, and the as-of date at the bottom. It also owns the loading and
// error states, so each panel loads and fails on its own without blanking
// the page (spec §6).
export function Card({
  actions,
  asOf,
  children,
  error,
  isLoading = false,
  onRetry,
  title,
}: CardProps): ReactNode {
  return (
    <section className="card" aria-busy={isLoading}>
      <header className="card-header">
        <h2 className="card-title">{title}</h2>
        {actions}
      </header>
      <div className="card-body">
        {renderBody({ children, error, isLoading, onRetry })}
      </div>
      {asOf != null && (
        <footer className="card-footer">As of {formatDate(asOf)}</footer>
      )}
    </section>
  );
}

function renderBody({
  children,
  error,
  isLoading,
  onRetry,
}: Pick<CardProps, 'children' | 'error' | 'isLoading' | 'onRetry'>): ReactNode {
  if (error != null) {
    return (
      <div className="card-error" role="alert">
        <p>{error.message}</p>
        {onRetry !== undefined && (
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }
  if (isLoading === true) {
    return <div className="skeleton" aria-label="Loading" />;
  }
  return children;
}
