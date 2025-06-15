'use client';

import React, { useCallback, useEffect, useRef, memo } from 'react';
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
  onScroll?: (scrollTop: number) => void;
}

const PAGE_SIZE = 50;

const VerseListContainer = memo(function VerseListContainer({ selectedSurah, onScroll }: VerseListContainerProps) {
  const { settings } = useSettings();
  const listRef = useRef<List>(null);
  const { surahNames, fetchSurahName } = useSurahNames();

  const {
    verses,
    versesLoading,
    versesError,
    isItemLoaded,
    loadMoreItems,
    itemCount
  } = useVirtualizedVerses({
    surahNumber: selectedSurah.number,
    totalVersesCount: selectedSurah.ayas,
  });

  const {
    itemSizes,
    setItemSize,
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

  // Memoize callback functions passed to virtualized list
  const getItemSize = useCallback((index: number) => {
    return itemSizes.get(index) || getEstimatedItemSize(index);
  }, [itemSizes, getEstimatedItemSize]);

  const handleItemsRendered = useCallback((props: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => {
    loadMoreItems(props.visibleStartIndex, props.visibleStopIndex);
  }, [loadMoreItems]);

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    if (onScroll) {
      onScroll(scrollOffset);
    }
  }, [onScroll]);

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
  }, [itemCount, resetItemSizes]);

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
                      handleItemsRendered(props);
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
});

export default VerseListContainer;