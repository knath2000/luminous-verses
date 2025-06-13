import { useState, useEffect, useCallback, useRef } from 'react';
import { VerseData, fetchVersesBatch } from '../utils/quranApi';


const PAGE_SIZE = 50; // Number of verses to load per batch

interface UseVirtualizedVersesProps {
  surahNumber: number | null;
  totalVersesCount: number;
}

export const useVirtualizedVerses = ({ surahNumber, totalVersesCount }: UseVirtualizedVersesProps) => {
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [versesError, setVersesError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadedPages = useRef<Set<number>>(new Set());
  const totalVersesCountRef = useRef(totalVersesCount);

  // Update ref when totalVersesCount changes
  useEffect(() => {
    totalVersesCountRef.current = totalVersesCount;
  }, [totalVersesCount]);

  // Reset state when surah changes
  useEffect(() => {
    if (surahNumber !== null) {
      setVerses([]);
      setHasMore(true);
      setVersesError(null);
      loadedPages.current.clear();
    }
  }, [surahNumber]);

  const isItemLoaded = useCallback((index: number) => {
    const loaded = !!verses[index];
    console.log(`🔍 isItemLoaded(${index}):`, loaded, `verses[${index}]:`, verses[index] ? `${verses[index].surahId}:${verses[index].numberInSurah}` : 'undefined');
    return loaded;
  }, [verses]);

  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number) => {
    const currentTotalVersesCount = totalVersesCountRef.current;

    if (!surahNumber || versesLoading || !hasMore) {
      return;
    }

    const startPage = Math.floor(startIndex / PAGE_SIZE);
    const endPage = Math.floor(stopIndex / PAGE_SIZE);

    const pagesToLoad: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      if (!loadedPages.current.has(i)) {
        pagesToLoad.push(i);
      }
    }

    if (pagesToLoad.length === 0) {
      return;
    }

    setVersesLoading(true);
    setVersesError(null);

    try {
      await Promise.all(pagesToLoad.map(async (page) => {
        const startVerse = page * PAGE_SIZE + 1;
        const endVerse = Math.min((page + 1) * PAGE_SIZE, currentTotalVersesCount);

        if (startVerse > currentTotalVersesCount) {
          setHasMore(false);
          return;
        }

        const response = await fetchVersesBatch(
          surahNumber,
          startVerse,
          endVerse,
          true, // includeTranslations
          true  // includeTransliterations
        );

        setVerses((prevVerses) => {
          const newVerses = [...prevVerses];
          console.log(`📚 Loading verses for surah ${surahNumber}, page ${page}:`, response.verses.length, 'verses');
          response.verses.forEach((verse) => {
            const index = verse.numberInSurah - 1;
            newVerses[index] = verse;
            console.log(`📖 Setting verse at index ${index}:`, `${verse.surahId}:${verse.numberInSurah}`);
          });
          console.log(`📊 Updated verses array - length: ${newVerses.length}, actual items:`, newVerses.filter(v => v).length);
          return newVerses;
        });

        loadedPages.current.add(page);
        if (response.pagination.end >= currentTotalVersesCount) {
          setHasMore(false);
        }
      }));
    } catch (err) {
      console.error('Error fetching verses batch:', err);
      setVersesError(err instanceof Error ? err.message : 'Failed to load verses batch');
      setHasMore(false);
    } finally {
      setVersesLoading(false);
    }
  }, [surahNumber, versesLoading, hasMore]);

  // Initial load for the first page when surah is selected
  useEffect(() => {
    if (surahNumber !== null && verses.length === 0 && hasMore && !versesLoading) {
      loadMoreItems(0, PAGE_SIZE - 1);
    }
  }, [surahNumber, verses.length, hasMore, versesLoading, loadMoreItems]);

  return {
    verses,
    versesLoading,
    versesError,
    hasMore,
    isItemLoaded,
    loadMoreItems,
    itemCount: hasMore ? totalVersesCount + 1 : totalVersesCount, // Add 1 for loading indicator
  };
};