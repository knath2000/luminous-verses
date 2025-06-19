'use client';

import React, { useCallback, useEffect, useRef, memo, forwardRef, useImperativeHandle } from 'react';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import VerseItem from './VerseItem';
import { useVirtualizedVerses } from '../hooks/useVirtualizedVerses';
import { useImprovedDynamicItemSize } from '../hooks/useImprovedDynamicItemSize';
import { useSettings } from '../contexts/SettingsContext';
import VerseSkeleton from './VerseSkeleton';
import { SurahMetadata } from '../utils/quranApi';
import { useSurahNames } from '../hooks/useSurahNames';

interface VerseListContainerProps {
  selectedSurah: SurahMetadata;
  onScroll?: (scrollTop: number, visibleIndex?: number) => void;
  scrollToVerse?: number | null; // 1-based verse number
  onScrolledToVerse?: () => void;
}

// Export the imperative handle interface
export interface VerseListContainerHandle {
  scrollToItem: (index: number, align?: 'start' | 'center' | 'end' | 'smart') => void;
  scrollTo: (scrollOffset: number) => void;
}

const PAGE_SIZE = 50;

const VerseListContainer = memo(forwardRef<VerseListContainerHandle, VerseListContainerProps>(function VerseListContainer({ selectedSurah, onScroll, scrollToVerse, onScrolledToVerse }, ref) {
  const { settings } = useSettings();
  const listRef = useRef<List>(null);
  const { surahNames, fetchSurahName } = useSurahNames();

  // Expose imperative methods via ref
  useImperativeHandle(ref, () => ({
    scrollToItem: (index: number, align: 'start' | 'center' | 'end' | 'smart' = 'start') => {
      if (listRef.current) {
        listRef.current.scrollToItem(index, align);
      }
    },
    scrollTo: (scrollOffset: number) => {
      if (listRef.current) {
        listRef.current.scrollTo(scrollOffset);
      }
    },
  }), []);

  const {
    verses,
    versesLoading,
    versesError,
    isItemLoaded,
    loadMoreItems: originalLoadMoreItems,
    itemCount
  } = useVirtualizedVerses({
    surahNumber: selectedSurah.number,
    totalVersesCount: selectedSurah.ayas,
  });

  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number) => {
    console.log(`%c[Debug] loadMoreItems: startIndex=${startIndex}, stopIndex=${stopIndex}`, 'color: #0f0;');
    return originalLoadMoreItems(startIndex, stopIndex);
  }, [originalLoadMoreItems]);

  const {
    itemSizes,
    setItemSize: originalSetItemSize,
    resetItemSizes,
    getEstimatedItemSize,
  } = useImprovedDynamicItemSize({
    initialItemCount: itemCount,
    listRef: listRef,
    estimateItemSize: useCallback((index: number) => {
      const verse = verses[index];
      if (!verse) return 150;

      let estimatedHeight = 100;
      
      estimatedHeight += Math.ceil(verse.text.length / 30) * 25;

      if (settings.showTransliteration && verse.transliteration) {
        estimatedHeight += Math.ceil(verse.transliteration.length / 40) * 20;
      }
      if (settings.showTranslation && verse.translation) {
        estimatedHeight += Math.ceil(verse.translation.length / 50) * 18;
      }
      
      return Math.max(estimatedHeight, 150);
    }, [verses, settings.showTransliteration, settings.showTranslation]),
  });

  const setItemSize = useCallback((index: number, size: number) => {
    if (itemSizes.get(index) !== size) {
      console.log(`%c[Debug] setItemSize: index=${index}, new_size=${size}`, 'color: #f0f;');
      originalSetItemSize(index, size);
      if (listRef.current) {
        console.log(`%c[Debug] resetAfterIndex: index=${index}`, 'color: #f0f;');
        listRef.current.resetAfterIndex(index);
      }
    }
  }, [itemSizes, originalSetItemSize, listRef]);

  // Memoize callback functions passed to virtualized list
  const getItemSize = useCallback((index: number) => {
    return itemSizes.get(index) || getEstimatedItemSize(index);
  }, [itemSizes, getEstimatedItemSize]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleItemsRendered = useCallback((props: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => {
    loadMoreItems(props.visibleStartIndex, props.visibleStopIndex);
  }, [loadMoreItems]);

  // Track visible index for scroll preservation using ref to avoid circular dependency
  const visibleStartIndexRef = useRef(0);

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    console.log(`%c[Debug] onScroll: offset=${scrollOffset}`, 'color: #ff0;');
    if (onScroll) {
      onScroll(scrollOffset, visibleStartIndexRef.current);
    }
  }, [onScroll]);

  // Update visible index when items are rendered
  const handleItemsRenderedWithIndex = useCallback((props: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => {
    console.log(`%c[Debug] onItemsRendered: visibleStartIndex=${props.visibleStartIndex}, visibleStopIndex=${props.visibleStopIndex}`, 'color: #0ff;');
    visibleStartIndexRef.current = props.visibleStartIndex;
    loadMoreItems(props.visibleStartIndex, props.visibleStopIndex);
  }, [loadMoreItems]);

  // Fetch surah names for all loaded verses
  useEffect(() => {
    verses.forEach(verse => {
      if (verse?.surahId && !surahNames.has(verse.surahId)) {
        fetchSurahName(verse.surahId);
      }
    });
  }, [verses, surahNames, fetchSurahName]);

  useEffect(() => {
    resetItemSizes();
  }, [selectedSurah.number, resetItemSizes]);

  // Scroll to verse when scrollToVerse changes
  useEffect(() => {
    if (scrollToVerse && listRef.current) {
      // verse numbers are 1-based, list indices are 0-based
      const index = scrollToVerse - 1;
      listRef.current.scrollToItem(index, 'center');
      if (onScrolledToVerse) {
        // Delay to allow scroll animation
        setTimeout(() => onScrolledToVerse(), 400);
      }
    }
  }, [scrollToVerse, onScrolledToVerse]);

  const itemData = {
    verses,
    setSize: setItemSize,
    settings,
    surahNames,
  };

  if (versesError) {
    return (
      <div className="flex-grow overflow-hidden h-full flex flex-col items-center justify-center p-4 text-red-400">
        <p className="text-lg">Error loading verses: {versesError}</p>
      </div>
    );
  }

  if (versesLoading && verses.length === 0) {
    return (
      <div className="flex-grow overflow-hidden h-full flex flex-col items-center justify-center p-4">
        <VerseSkeleton />
        <p className="text-white/70 text-lg mt-4">Loading verses...</p>
      </div>
    );
  }

  if (verses.length === 0 && !versesLoading && selectedSurah !== null) {
    return (
      <div className="flex-grow overflow-hidden h-full flex flex-col items-center justify-center p-4 text-white/70">
        <p className="text-lg">No verses found for this Surah.</p>
      </div>
    );
  }
  
  return (
    <div className="flex-grow overflow-hidden h-full">
      <AutoSizer>
        {({ height: autoSizerHeight, width: autoSizerWidth }) => {
          return (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
              threshold={PAGE_SIZE / 2}
            >
              {({ onItemsRendered: infiniteLoaderOnItemsRendered }) => {
                return (
                  <List
                    ref={listRef}
                    height={autoSizerHeight}
                    width={autoSizerWidth}
                    itemCount={itemCount}
                    itemData={itemData}
                    itemSize={getItemSize}
                    onItemsRendered={(props) => {
                      infiniteLoaderOnItemsRendered(props);
                      handleItemsRenderedWithIndex(props);
                    }}
                    onScroll={handleScroll}
                    overscanCount={5}
                    className="custom-scrollbar"
                  >
                    {VerseItem}
                  </List>
                );
              }}
            </InfiniteLoader>
          );
        }}
      </AutoSizer>

      {versesLoading && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gold/30 border-t-gold mb-2"></div>
          <p className="text-white/70 text-sm">Loading more verses...</p>
        </div>
      )}
    </div>
  );
}));

export default VerseListContainer;