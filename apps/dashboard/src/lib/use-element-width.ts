import { useEffect, useState } from 'react';

export function useElementWidth<T extends HTMLElement>(): [
  (element: T | null) => void,
  number,
] {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (element === null) return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry !== undefined) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [element]);

  return [setElement, width];
}
