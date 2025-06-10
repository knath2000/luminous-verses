'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { fetchVersesBatch, VerseData } from '../utils/quranApi';
import TransliterationDisplay from './TransliterationDisplay';
import { ClickableVerseContainer } from './ClickableVerseContainer';
import { useSettings } from '../contexts/SettingsContext';
import { useUserGesture } from '../contexts/UserGestureContext';

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
    surahNumber: number;
    setSize: (index: number, size: number) => void;
  };
}

// Custom hook for dynamic item sizing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useDynamicItemSize = (_itemCount: number) => {
  const listRef = useRef<List>(null);
  const sizeMap = useRef<{ [key: number]: number }>({});

  const setSize = useCallback((index: number, size: number) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    if (listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }, []);

  const getSize = useCallback((index: number): number => {
    return sizeMap.current[index] || 400; // Generous default height for Arabic + transliteration
  }, []);

  const resetAfterIndex = useCallback((index: number, shouldForceUpdate = true) => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(index, shouldForceUpdate);
    }
  }, []);

  return { listRef, setSize, getSize, resetAfterIndex };
};

const CHUNK_SIZE = 20; // Load 20 verses at a time

// Skeleton component for loading verses with glass morphism design
const VerseSkeleton: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{ ...style, padding: '24px', marginBottom: '24px' }}>
    <div className="glass-morphism p-6 rounded-xl border border-white/10 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/20"></div>
        </div>
      </div>
      <div className="text-center mb-6">
        <div className="h-8 bg-white/10 rounded mb-4"></div>
        <div className="h-6 bg-white/10 rounded mb-4"></div>
        <div className="h-4 bg-white/10 rounded"></div>
      </div>
    </div>
  </div>
);

// Individual verse item component with dynamic height measurement
const VerseItem: React.FC<VerseItemProps> = ({ index, style, data }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { verses, isItemLoaded, showTransliteration, onVerseClick, surahNumber, setSize } = data;
  const { isAudioReady } = useUserGesture();
  const itemRef = useRef<HTMLDivElement>(null);
  const verse = verses[index];

  // Measure actual content height after render
  useEffect(() => {
    if (itemRef.current && verse) {
      const height = itemRef.current.getBoundingClientRect().height;
      // Add buffer to prevent tight spacing and account for margins
      setSize(index, height + 48); // 48px buffer for spacing
    }
  }, [verse, showTransliteration, index, setSize]);

  if (!isItemLoaded(index)) {
    return <VerseSkeleton style={style} />;
  }

  if (!verse) {
    return <VerseSkeleton style={style} />;
  }

  return (
    <div 
      ref={itemRef}
      style={{ 
        ...style, 
        overflow: 'visible',
        padding: '24px',
        marginBottom: '24px'
      }}
    >
      <ClickableVerseContainer
        surah={surahNumber}
        verse={verse.numberInSurah}
        className="glass-morphism p-6 rounded-xl border border-white/10 hover:border-gold/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-gold/10"
        showPlayButton={true}
        playButtonPosition="top-right"
      >
        {/* Audio Unlock Hint */}
        {!isAudioReady && (
          <div className="absolute top-4 left-4 bg-purple-500/20 px-3 py-1 rounded-full backdrop-blur-sm z-20">
            <span className="text-purple-300 text-xs font-medium">Tap to unlock audio</span>
          </div>
        )}

        {/* Verse Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
              {verse.numberInSurah}
            </div>
          </div>
          {verse.sajda && (
            <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full">
              <span className="text-purple-300 text-xs font-medium">SAJDA</span>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Arabic Text */}
        <div className="text-center mb-6">
          <p className="text-white text-2xl md:text-3xl lg:text-4xl leading-relaxed font-[family-name:var(--font-amiri)] mb-6" dir="rtl">
            {verse.text}
          </p>
          
          {/* Transliteration */}
          {showTransliteration && verse.transliteration && (
            <TransliterationDisplay 
              transliteration={verse.transliteration}
              size="medium"
              className="mb-4"
            />
          )}
          
          {/* English Translation */}
          {verse.translation && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-white/90 text-lg md:text-xl leading-relaxed font-medium italic" dir="ltr">
                &ldquo;{verse.translation}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={(e) => e.stopPropagation()}
            className="group flex items-center gap-2 glass-morphism px-4 py-2 rounded-full hover:bg-purple-500/20 transition-all duration-300"
          >
            <svg className="w-4 h-4 text-purple-300 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            <span className="text-white text-sm font-medium">Save</span>
          </button>

          <button
            onClick={(e) => e.stopPropagation()}
            className="group flex items-center gap-2 glass-morphism px-4 py-2 rounded-full hover:bg-blue-500/20 transition-all duration-300"
          >
            <svg className="w-4 h-4 text-blue-300 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            <span className="text-white text-sm font-medium">Share</span>
          </button>
        </div>

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-white/60">
          <span>Juz {verse.juz}</span>
          <span>Hizb Quarter {verse.hizbQuarter}</span>
        </div>

        {/* Click instruction */}
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-xs">
            Click anywhere on the verse card to play audio recitation
          </p>
        </div>
      </ClickableVerseContainer>
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
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to track loading state without causing re-renders
  const loadingChunksRef = useRef<Set<number>>(new Set());
  const isLoadingRef = useRef<boolean>(false);
  
  // Dynamic sizing hook
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { listRef, setSize, getSize, resetAfterIndex } = useDynamicItemSize(totalVerses);

  // Check if an item is loaded
  const isItemLoaded = useCallback((index: number): boolean => {
    return verses[index] !== undefined;
  }, [verses]);

  // Load more items function with stable dependencies
  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number): Promise<void> => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      return;
    }

    // Calculate which chunks we need to load
    const startChunk = Math.floor(startIndex / CHUNK_SIZE);
    const endChunk = Math.floor(stopIndex / CHUNK_SIZE);
    
    const chunksToLoad: number[] = [];
    for (let chunk = startChunk; chunk <= endChunk; chunk++) {
      if (!loadingChunksRef.current.has(chunk)) {
        chunksToLoad.push(chunk);
      }
    }

    if (chunksToLoad.length === 0) {
      return; // Nothing to load
    }

    // Mark chunks as loading
    chunksToLoad.forEach(chunk => loadingChunksRef.current.add(chunk));
    isLoadingRef.current = true;

    try {
      // Load all chunks in parallel
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
      chunksToLoad.forEach(chunk => loadingChunksRef.current.delete(chunk));
      isLoadingRef.current = false;
    }
  }, [surahNumber, totalVerses, settings.showTransliteration]);

  // Preload first chunk on mount - use a flag to prevent multiple calls
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      loadMoreItems(0, CHUNK_SIZE - 1);
    }
  }, [loadMoreItems]);

  // Memoized item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    verses,
    loadMoreItems,
    isItemLoaded,
    showTransliteration: settings.showTransliteration,
    onVerseClick,
    surahNumber,
    setSize
  }), [verses, loadMoreItems, isItemLoaded, settings.showTransliteration, onVerseClick, surahNumber, setSize]);

  // Force remeasurement when transliteration setting changes
  useEffect(() => {
    resetAfterIndex(0);
  }, [settings.showTransliteration, resetAfterIndex]);

  // Force initial measurement after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      resetAfterIndex(0);
    }, 100);
    return () => clearTimeout(timer);
  }, [resetAfterIndex]);

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ {error}</div>
          <button 
            onClick={() => {
              setError(null);
              hasInitializedRef.current = false;
              loadingChunksRef.current.clear();
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
    <div className={`${className}`} style={{ height: '70vh', minHeight: '500px' }}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={totalVerses}
        loadMoreItems={loadMoreItems}
        threshold={3} // Start loading when 3 items away from the end
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={(node) => {
              // Combine refs
              if (typeof ref === 'function') ref(node);
              if (listRef) listRef.current = node;
            }}
            height={typeof window !== 'undefined' ? window.innerHeight * 0.7 : 500} // 70% of viewport height with SSR safety
            width="100%" // Full width
            itemCount={totalVerses}
            itemSize={getSize}
            itemData={itemData}
            onItemsRendered={onItemsRendered}
            overscanCount={2} // Render 2 extra items outside viewport for performance
            className="scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent"
          >
            {VerseItem}
          </List>
        )}
      </InfiniteLoader>
    </div>
  );
};

export default VirtualizedVerseList;