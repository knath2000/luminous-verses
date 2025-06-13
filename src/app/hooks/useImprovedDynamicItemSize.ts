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
    if (itemSizes.current.get(index) !== size) {
      itemSizes.current.set(index, size);
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  }, [listRef]);

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