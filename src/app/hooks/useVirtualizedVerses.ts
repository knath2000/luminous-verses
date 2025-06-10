'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchVersesBatch, fetchSurahs, VerseData } from '../utils/quranApi';

interface UseVirtualizedVersesProps {
  surahNumber: number;
  chunkSize?: number;
  includeTranslations?: boolean;
  includeTransliterations?: boolean;
}

interface UseVirtualizedVersesReturn {
  verses: (VerseData | undefined)[];
  totalVerses: number;
  loading: boolean;
  error: string | null;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
  isItemLoaded: (index: number) => boolean;
  retry: () => void;
}

export function useVirtualizedVerses({
  surahNumber,
  chunkSize = 20,
  includeTranslations = true,
  includeTransliterations = true
}: UseVirtualizedVersesProps): UseVirtualizedVersesReturn {
  const [verses, setVerses] = useState<(VerseData | undefined)[]>([]);
  const [totalVerses, setTotalVerses] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingChunks, setLoadingChunks] = useState<Set<number>>(new Set());

  // Initialize total verses count
  useEffect(() => {
    const initializeTotalVerses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const surahs = await fetchSurahs();
        const surah = surahs.find(s => s.number === surahNumber);
        
        if (!surah) {
          throw new Error(`Surah ${surahNumber} not found`);
        }
        
        const verseCount = surah.ayas;
        setTotalVerses(verseCount);
        setVerses(new Array(verseCount).fill(undefined));
        
      } catch (err) {
        console.error('Error initializing verses:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize verses');
      } finally {
        setLoading(false);
      }
    };

    initializeTotalVerses();
  }, [surahNumber]);

  // Check if an item is loaded
  const isItemLoaded = useCallback((index: number): boolean => {
    return verses[index] !== undefined;
  }, [verses]);

  // Load more items function
  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number): Promise<void> => {
    if (totalVerses === 0) return;

    // Calculate which chunks this range belongs to
    const startChunk = Math.floor(startIndex / chunkSize);
    const endChunk = Math.floor(stopIndex / chunkSize);
    
    // Find chunks that need loading
    const chunksToLoad: number[] = [];
    for (let chunk = startChunk; chunk <= endChunk; chunk++) {
      if (!loadingChunks.has(chunk)) {
        // Check if any verse in this chunk is already loaded
        const chunkStart = chunk * chunkSize;
        const chunkEnd = Math.min((chunk + 1) * chunkSize - 1, totalVerses - 1);
        
        let chunkNeedsLoading = false;
        for (let i = chunkStart; i <= chunkEnd; i++) {
          if (!isItemLoaded(i)) {
            chunkNeedsLoading = true;
            break;
          }
        }
        
        if (chunkNeedsLoading) {
          chunksToLoad.push(chunk);
        }
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
      // Load chunks in parallel for better performance
      const chunkPromises = chunksToLoad.map(async (chunk) => {
        const start = chunk * chunkSize + 1; // API uses 1-based indexing
        const end = Math.min((chunk + 1) * chunkSize, totalVerses);
        
        try {
          const result = await fetchVersesBatch(
            surahNumber,
            start,
            end,
            includeTranslations,
            includeTransliterations
          );
          
          return { 
            chunk, 
            verses: result.verses, 
            start: start - 1, // Convert back to 0-based for array indexing
            success: true 
          };
        } catch (error) {
          console.error(`Failed to load chunk ${chunk} (verses ${start}-${end}):`, error);
          return { 
            chunk, 
            verses: [], 
            start: start - 1, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const results = await Promise.all(chunkPromises);
      
      // Update verses array with loaded data
      setVerses(prevVerses => {
        const newVerses = [...prevVerses];
        
        results.forEach(({ verses: chunkVerses, start, success }) => {
          if (success) {
            chunkVerses.forEach((verse, index) => {
              newVerses[start + index] = verse;
            });
          }
        });
        
        return newVerses;
      });

      // Check if any chunks failed
      const failedChunks = results.filter(r => !r.success);
      if (failedChunks.length > 0) {
        console.warn(`${failedChunks.length} chunks failed to load`);
        // Don't set error for partial failures, just log them
      }

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
  }, [surahNumber, totalVerses, chunkSize, includeTranslations, includeTransliterations, loadingChunks, isItemLoaded]);

  // Retry function
  const retry = useCallback(() => {
    setError(null);
    setLoadingChunks(new Set());
    if (totalVerses > 0) {
      // Reload first chunk
      loadMoreItems(0, Math.min(chunkSize - 1, totalVerses - 1));
    }
  }, [loadMoreItems, chunkSize, totalVerses]);

  return {
    verses,
    totalVerses,
    loading,
    error,
    loadMoreItems,
    isItemLoaded,
    retry
  };
}

export default useVirtualizedVerses;