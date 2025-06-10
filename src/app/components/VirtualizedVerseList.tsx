'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { fetchVersesBatch, VerseData } from '../utils/quranApi';
import TransliterationDisplay from './TransliterationDisplay';
import { useSettings } from '../contexts/SettingsContext';

interface VirtualizedVerseListProps {
  surahNumber: number;
  totalVerses: number;
  onVerseClick?: (verse: VerseData) => void;
  className?: string;
}

interface VerseItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    verses: (VerseData | undefined)[];
    loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
    isItemLoaded: (index: number) => boolean;
    showTransliteration: boolean;
    onVerseClick?: (verse: VerseData) => void;
  };
}

const ITEM_HEIGHT = 120; // Base height for each verse item
const CHUNK_SIZE = 20; // Load 20 verses at a time

// Skeleton component for loading verses
const VerseSkeleton: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={style} className="p-4 border-b border-purple-100">
    <div className="animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-8 h-8 bg-purple-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-purple-200 rounded w-3/4"></div>
          <div className="h-4 bg-purple-200 rounded w-1/2"></div>
          <div className="h-3 bg-purple-100 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  </div>
);

// Individual verse item component
const VerseItem: React.FC<VerseItemProps> = ({ index, style, data }) => {
  const { verses, isItemLoaded, showTransliteration, onVerseClick } = data;
  const verse = verses[index];

  if (!isItemLoaded(index)) {
    return <VerseSkeleton style={style} />;
  }

  if (!verse) {
    return <VerseSkeleton style={style} />;
  }

  return (
    <div 
      style={style} 
      className="p-4 border-b border-purple-100 hover:bg-purple-50/30 transition-colors cursor-pointer"
      onClick={() => onVerseClick?.(verse)}
    >
      <div className="flex items-start space-x-4">
        {/* Verse number */}
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {verse.numberInSurah}
        </div>
        
        {/* Verse content */}
        <div className="flex-1 space-y-2">
          {/* Arabic text */}
          <div className="text-right text-lg leading-relaxed font-arabic text-gray-800" dir="rtl">
            {verse.text}
          </div>
          
          {/* Translation */}
          {verse.translation && (
            <div className="text-gray-700 leading-relaxed">
              {verse.translation}
            </div>
          )}
          
          {/* Transliteration */}
          {showTransliteration && verse.transliteration && (
            <div className="mt-2">
              <TransliterationDisplay 
                transliteration={verse.transliteration}
                showLabel={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const VirtualizedVerseList: React.FC<VirtualizedVerseListProps> = ({
  surahNumber,
  totalVerses,
  onVerseClick,
  className = ''
}) => {
  const { settings } = useSettings();
  const [verses, setVerses] = useState<(VerseData | undefined)[]>(
    new Array(totalVerses).fill(undefined)
  );
  const [loadingChunks, setLoadingChunks] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Check if an item is loaded
  const isItemLoaded = useCallback((index: number): boolean => {
    return verses[index] !== undefined;
  }, [verses]);

  // Load more items function
  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number): Promise<void> => {
    // Calculate which chunk this range belongs to
    const startChunk = Math.floor(startIndex / CHUNK_SIZE);
    const endChunk = Math.floor(stopIndex / CHUNK_SIZE);
    
    // Load all chunks in the range
    const chunksToLoad: number[] = [];
    for (let chunk = startChunk; chunk <= endChunk; chunk++) {
      if (!loadingChunks.has(chunk)) {
        chunksToLoad.push(chunk);
      }
    }

    if (chunksToLoad.length === 0) return;

    // Mark chunks as loading
    setLoadingChunks(prev => {
      const newSet = new Set(prev);
      chunksToLoad.forEach(chunk => newSet.add(chunk));
      return newSet;
    });

    try {
      // Load chunks in parallel
      const chunkPromises = chunksToLoad.map(async (chunk) => {
        const start = chunk * CHUNK_SIZE + 1;
        const end = Math.min((chunk + 1) * CHUNK_SIZE, totalVerses);
        
        try {
          const result = await fetchVersesBatch(
            surahNumber,
            start,
            end,
            true, // include translations
            settings.showTransliteration // include transliterations based on settings
          );
          
          return { chunk, verses: result.verses, start: start - 1 }; // Convert to 0-based index
        } catch (error) {
          console.error(`Failed to load chunk ${chunk}:`, error);
          return { chunk, verses: [], start: start - 1, error };
        }
      });

      const results = await Promise.all(chunkPromises);
      
      // Update verses array with loaded data
      setVerses(prevVerses => {
        const newVerses = [...prevVerses];
        
        results.forEach(({ verses: chunkVerses, start }) => {
          chunkVerses.forEach((verse, index) => {
            newVerses[start + index] = verse;
          });
        });
        
        return newVerses;
      });

    } catch (error) {
      console.error('Error loading verse chunks:', error);
      setError('Failed to load verses. Please try again.');
    } finally {
      // Mark chunks as no longer loading
      setLoadingChunks(prev => {
        const newSet = new Set(prev);
        chunksToLoad.forEach(chunk => newSet.delete(chunk));
        return newSet;
      });
    }
  }, [surahNumber, totalVerses, settings.showTransliteration, loadingChunks]);

  // Preload first chunk on mount
  useEffect(() => {
    loadMoreItems(0, CHUNK_SIZE - 1);
  }, [loadMoreItems]);

  // Memoized item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    verses,
    loadMoreItems,
    isItemLoaded,
    showTransliteration: settings.showTransliteration,
    onVerseClick
  }), [verses, loadMoreItems, isItemLoaded, settings.showTransliteration, onVerseClick]);

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ {error}</div>
          <button 
            onClick={() => {
              setError(null);
              loadMoreItems(0, CHUNK_SIZE - 1);
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={totalVerses}
        loadMoreItems={loadMoreItems}
        threshold={5} // Start loading when 5 items away from the end
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={ref}
            height={600} // Fixed height for the virtualized list
            width="100%" // Full width
            itemCount={totalVerses}
            itemSize={ITEM_HEIGHT}
            itemData={itemData}
            onItemsRendered={onItemsRendered}
            overscanCount={5} // Render 5 extra items outside viewport
            className="scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100"
          >
            {VerseItem}
          </List>
        )}
      </InfiniteLoader>
    </div>
  );
};

export default VirtualizedVerseList;