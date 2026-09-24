import { useEffect, useState } from 'react';

// State that survives a page reload, stored in localStorage under `key`
// (spec §6: the selected portfolio and horizon persist per browser).
// `isValid` rejects stale or hand-edited values, which then fall back to
// `initial` instead of breaking the page.
export function usePersistedState<T extends string>(
  key: string,
  initial: T,
  isValid: (value: string) => value is T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = readStorage(key);
    return stored !== null && isValid(stored) ? stored : initial;
  });

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}

// localStorage can throw, for example in some private-browsing modes.
// Persistence is a convenience, so those failures are ignored.
function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignored: the value simply won't survive a reload.
  }
}
