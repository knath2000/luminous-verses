import { useRef, useState, RefObject, useLayoutEffect, useCallback } from 'react';

type Size = {
  width: number;
  height: number;
};

interface ResizeObserverOptions {
  onResize?: (size: Size) => void;
  debounceMs?: number;
  threshold?: number; // Minimum change to trigger callback
}

function useResizeObserver<T extends HTMLElement = HTMLElement>(
  options: ResizeObserverOptions = {}
): [RefObject<T | null>, Size] {
  const { onResize, debounceMs = 0, threshold = 1 } = options;
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSize = useRef<Size>({ width: 0, height: 0 });

  const debouncedCallback = useCallback((newSize: Size) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (debounceMs > 0) {
      debounceTimer.current = setTimeout(() => {
        setSize(newSize);
        onResize?.(newSize);
      }, debounceMs);
    } else {
      setSize(newSize);
      onResize?.(newSize);
    }
  }, [onResize, debounceMs]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Use synchronous measurement instead of requestAnimationFrame
        const { width, height } = entry.contentRect;
        const newSize = { width, height };
        
        // Only trigger callback if change is significant
        const widthDiff = Math.abs(newSize.width - lastSize.current.width);
        const heightDiff = Math.abs(newSize.height - lastSize.current.height);
        
        if (widthDiff >= threshold || heightDiff >= threshold) {
          lastSize.current = newSize;
          debouncedCallback(newSize);
        }
      }
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [debouncedCallback, threshold]);

  return [ref, size];
}

export default useResizeObserver;