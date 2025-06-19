import { useState, useCallback, useRef, useEffect, RefObject } from 'react';
import { VariableSizeList as List } from 'react-window';

interface UseImprovedDynamicItemSizeOptions {
  initialItemCount: number;
  estimateItemSize: (index: number) => number;
  listRef: RefObject<List | null>; // Allow null for listRef
}

export const useImprovedDynamicItemSize = ({
  initialItemCount,
  estimateItemSize,
  listRef,
}: UseImprovedDynamicItemSizeOptions) => {
  const itemSizes = useRef(new Map<number, number>());
  const [ready, setReady] = useState(false);

  const setItemSize = useCallback((index: number, size: number) => {
    const currentSize = itemSizes.current.get(index);
    const estimatedSize = estimateItemSize(index);

    // Only update and reset if the size is new and significantly different from the estimate
    // This prevents layout thrashing from minor fluctuations or repeated measurements.
    const sizeDifference = Math.abs(size - (currentSize || estimatedSize));

    if (currentSize !== size && sizeDifference > 10) { // Only reset if difference is > 10px
      itemSizes.current.set(index, size);
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    } else if (!currentSize) {
      // If it's the first measurement, store it without resetting the whole list
      // unless it's very different from the initial guess.
      itemSizes.current.set(index, size);
    }
  }, [listRef, estimateItemSize]);

  const getEstimatedItemSize = useCallback((index: number) => {
    return itemSizes.current.get(index) || estimateItemSize(index);
  }, [estimateItemSize]);

  const resetItemSizes = useCallback(() => {
    itemSizes.current = new Map<number, number>();
    setReady(false);
  }, []);

  useEffect(() => {
    if (initialItemCount > 0 && !ready) {
      setReady(true);
    }
  }, [initialItemCount, ready]);

  return {
    itemSizes: itemSizes.current,
    setItemSize,
    resetItemSizes,
    getEstimatedItemSize,
  };
};