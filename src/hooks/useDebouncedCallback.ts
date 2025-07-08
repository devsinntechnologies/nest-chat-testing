import { useRef, useEffect, useCallback } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedCallback;
}