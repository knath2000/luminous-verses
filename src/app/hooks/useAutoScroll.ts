'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { 
  scrollToElement, 
  getVerseElementId, 
  announceVerseChange, 
  throttle,
  isElementInViewport 
} from '../utils/scrollUtils';

interface VerseInfo {
  surah: number;
  verse: number;
  surahName?: string;
}

interface UseAutoScrollOptions {
  enabled?: boolean;
  delay?: number;
  announceToScreenReader?: boolean;
}

/**
 * Hook for auto-scrolling during verse playback
 * Based on research from Perplexity and Context7 MCP tools
 */
export function useAutoScroll(
  currentVerse: VerseInfo | null,
  isPlaying: boolean,
  options: UseAutoScrollOptions = {}
) {
  const { settings } = useSettings();
  const lastScrolledVerseRef = useRef<string | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manualScrollPauseRef = useRef<boolean>(false);
  const manualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    enabled = true,
    delay = 300,
    announceToScreenReader = true
  } = options;

  // Check if auto-scroll should be active
  const shouldAutoScroll = enabled && settings.autoScroll && isPlaying && currentVerse;

  // Throttled scroll function for performance
  const scrollToVerseInternal = useCallback((verse: VerseInfo) => {
    const elementId = getVerseElementId(verse.surah, verse.verse);
    const verseKey = `${verse.surah}:${verse.verse}`;

    // Skip if already scrolled to this verse
    if (lastScrolledVerseRef.current === verseKey) {
      return;
    }

    // Skip if manual scroll is active
    if (manualScrollPauseRef.current) {
      console.log('🔄 useAutoScroll: Manual scroll active, skipping auto-scroll');
      return;
    }

    // Check if element already in viewport center
    if (isElementInViewport(elementId)) {
      console.log('🔄 useAutoScroll: Verse already in viewport, skipping scroll');
      lastScrolledVerseRef.current = verseKey;
      return;
    }

    console.log('🔄 useAutoScroll: Scrolling to verse:', verse);

    // Perform scroll
    const scrollSuccess = scrollToElement(elementId, {
      behavior: 'smooth',
      block: 'center'
    });

    if (scrollSuccess) {
      lastScrolledVerseRef.current = verseKey;

      // Announce to screen readers
      if (announceToScreenReader) {
        announceVerseChange(verse.surah, verse.verse, verse.surahName);
      }
    }
  }, [announceToScreenReader]);

  const throttledScrollToVerse = useCallback((verse: VerseInfo) => {
    const throttledFn = throttle(() => {
      scrollToVerseInternal(verse);
    }, 100);
    throttledFn();
  }, [scrollToVerseInternal]);

  // Main scroll effect
  useEffect(() => {
    if (!shouldAutoScroll) {
      return;
    }

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Delay scroll to allow audio to start and UI to update
    scrollTimeoutRef.current = setTimeout(() => {
      throttledScrollToVerse(currentVerse);
    }, delay);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [shouldAutoScroll, currentVerse, delay, throttledScrollToVerse]);

  // Reset scroll tracking when verse changes
  useEffect(() => {
    if (currentVerse) {
      const verseKey = `${currentVerse.surah}:${currentVerse.verse}`;
      if (lastScrolledVerseRef.current !== verseKey) {
        lastScrolledVerseRef.current = null; // Reset for new verse
      }
    }
  }, [currentVerse]);

  // Handle manual scroll detection
  const handleManualScroll = useCallback(() => {
    if (!settings.autoScroll) return;

    // Pause auto-scroll temporarily
    manualScrollPauseRef.current = true;
    
    // Clear existing timeout
    if (manualScrollTimeoutRef.current) {
      clearTimeout(manualScrollTimeoutRef.current);
    }

    // Resume auto-scroll after 3 seconds of no manual scrolling
    manualScrollTimeoutRef.current = setTimeout(() => {
      manualScrollPauseRef.current = false;
      console.log('🔄 useAutoScroll: Resuming auto-scroll after manual scroll pause');
    }, 3000);
  }, [settings.autoScroll]);

  // Set up manual scroll detection
  useEffect(() => {
    if (!settings.autoScroll) return;

    const throttledScrollHandler = throttle(() => {
      handleManualScroll();
    }, 150);
    
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    window.addEventListener('wheel', throttledScrollHandler, { passive: true });
    window.addEventListener('touchmove', throttledScrollHandler, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      window.removeEventListener('wheel', throttledScrollHandler);
      window.removeEventListener('touchmove', throttledScrollHandler);
    };
  }, [settings.autoScroll, handleManualScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }
    };
  }, []);

  // Manual scroll to verse function
  const scrollToVerse = useCallback((surah: number, verse: number, surahName?: string) => {
    const elementId = getVerseElementId(surah, verse);
    const scrollSuccess = scrollToElement(elementId, {
      behavior: 'smooth',
      block: 'center'
    });

    if (scrollSuccess && announceToScreenReader) {
      announceVerseChange(surah, verse, surahName);
    }

    return scrollSuccess;
  }, [announceToScreenReader]);

  // Force scroll to current verse
  const scrollToCurrentVerse = useCallback(() => {
    if (currentVerse) {
      return scrollToVerse(currentVerse.surah, currentVerse.verse, currentVerse.surahName);
    }
    return false;
  }, [currentVerse, scrollToVerse]);

  return {
    // State
    isAutoScrollEnabled: settings.autoScroll,
    isManualScrollPaused: manualScrollPauseRef.current,
    
    // Actions
    scrollToVerse,
    scrollToCurrentVerse,
    
    // Utils
    getVerseElementId: (surah: number, verse: number) => getVerseElementId(surah, verse)
  };
}