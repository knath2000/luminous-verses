'use client';

import React, { useCallback, useEffect, useRef, memo } from 'react'; // Add memo
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import VerseItem from './VerseItem';
import { useVirtualizedVerses } from '../hooks/useVirtualizedVerses';
import { useImprovedDynamicItemSize } from '../hooks/useImprovedDynamicItemSize';
import { useSettings } from '../contexts/SettingsContext';
import VerseSkeleton from './VerseSkeleton';
import { SurahMetadata } from '../utils/quranApi';

interface VerseListContainerProps {
  selectedSurah: SurahMetadata;
  onScroll?: (scrollTop: number) => void; // Add onScroll prop
}

const PAGE_SIZE = 50;

const VerseListContainer = memo(function VerseListContainer({ selectedSurah, onScroll }: VerseListContainerProps) { // Add display name and onScroll prop
  const { settings } = useSettings();
  const listRef = useRef<List>(null); // Create a ref for the List component

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
    listRef: listRef, // Pass the ref directly
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

  useEffect(() => {
    resetItemSizes();
  }, [itemCount, resetItemSizes]);

  const itemData = {
    verses,
    setSize: setItemSize,
    settings,
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

  console.log('🔍 VerseListContainer render - verses.length:', verses.length, 'itemCount:', itemCount, 'versesLoading:', versesLoading);
  
  return (
    <div className="flex-grow overflow-hidden h-full">
      <AutoSizer>
        {({ height: autoSizerHeight, width: autoSizerWidth }) => {
          console.log('📐 AutoSizer dimensions:', { autoSizerHeight, autoSizerWidth });
          console.log('📊 InfiniteLoader config:', { itemCount, versesLength: verses.length, threshold: PAGE_SIZE / 2 });
          console.log('🎯 ItemData structure:', { versesCount: itemData.verses.length, hasSettings: !!itemData.settings });
          
          return (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
              threshold={PAGE_SIZE / 2}
            >
              {({ onItemsRendered: infiniteLoaderOnItemsRendered }) => {
                console.log('🔄 InfiniteLoader render function called');
                return (
                  <List
                    ref={listRef} // Assign the ref here
                    height={autoSizerHeight}
                    width={autoSizerWidth}
                    itemCount={itemCount}
                    itemData={itemData}
                    itemSize={(index: number) => {
                      const size = itemSizes.get(index) || getEstimatedItemSize(index);
                      console.log(`📏 Item ${index} size:`, size);
                      return size;
                    }}
                    onItemsRendered={(props) => {
                      console.log('👁️ List onItemsRendered:', props);
                      infiniteLoaderOnItemsRendered(props);
                    }}
                    onScroll={({ scrollOffset }) => { // Use scrollOffset instead of scrollTop
                      if (onScroll) {
                        onScroll(scrollOffset);
                      }
                    }}
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