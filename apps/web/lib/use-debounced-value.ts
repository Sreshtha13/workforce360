"use client";

import { useEffect, useState } from "react";

/** Returns [value, debouncedValue, setValue] */
export function useDebouncedValue<T>(initial: T, delayMs = 300): [T, T, (v: T) => void] {
  const [value, setValue] = useState(initial);
  const [debounced, setDebounced] = useState(initial);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return [value, debounced, setValue];
}
