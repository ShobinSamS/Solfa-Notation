import { useEffect } from 'react';

export function useDebouncedEffect(effect: () => void, deps: unknown[], delay = 500): void {
  useEffect(() => {
    const handle = window.setTimeout(effect, delay);
    return () => window.clearTimeout(handle);
  }, [...deps, delay]);
}
