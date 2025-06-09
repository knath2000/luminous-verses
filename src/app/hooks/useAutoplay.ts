'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { useSettings } from '../contexts/SettingsContext';
import { fetchSurahs, SurahMetadata } from '../utils/quranApi';
import { scrollToElement, getVerseElementId, announceVerseChange } from '../utils/scrollUtils';

/**
 * Hook to manage automatic verse playback with integrated auto-scrolling
 * Listens to audio 'ended' events and plays the next verse when autoplay is enabled
 */
export function useAutoplay() {
  const { addEventListener, controls, currentVerse, state } = useAudio();
  const { settings } = useSettings();
  const surahsRef = useRef<SurahMetadata[]>([]);
  const isLoadingSurahsRef = useRef(false);
  const lastProcessedVerseRef = useRef<string | null>(null);

  // Auto-scroll functionality - direct implementation
  const handleAutoScroll = useCallback((verse: { surah: number; verse: number }, surahName?: string) => {
    if (!settings.autoScroll) {
      console.log('🔄 useAutoplay: Auto-scroll disabled in settings');
      return;
    }

    const elementId = getVerseElementId(verse.surah, verse.verse);
    console.log('🔄 useAutoplay: Auto-scrolling to verse:', verse, 'elementId:', elementId);

    // Check if the element exists before attempting to scroll
    const element = document.getElementById(elementId);
    if (!element) {
      console.log('🔄 useAutoplay: Target verse element not found, skipping auto-scroll (likely single verse context)');
      // Still announce to screen readers even if we can't scroll
      announceVerseChange(verse.surah, verse.verse, surahName);
      return;
    }

    // Always scroll to ensure verse is centered and highlighted
    const scrollSuccess = scrollToElement(elementId, {
      behavior: 'smooth',
      block: 'center'
    });

    if (scrollSuccess) {
      console.log('🔄 useAutoplay: Successfully scrolled to verse:', verse);
      
      // Announce to screen readers
      announceVerseChange(verse.surah, verse.verse, surahName);
    } else {
      console.warn('🔄 useAutoplay: Failed to scroll to verse:', verse);
    }
  }, [settings.autoScroll]);

  // Load surahs metadata for verse count information
  const loadSurahs = useCallback(async () => {
    if (surahsRef.current.length > 0 || isLoadingSurahsRef.current) {
      return surahsRef.current;
    }

    try {
      isLoadingSurahsRef.current = true;
      console.log('🎵 useAutoplay: Loading surahs metadata...');
      const surahs = await fetchSurahs();
      surahsRef.current = surahs;
      console.log('🎵 useAutoplay: Loaded', surahs.length, 'surahs');
      return surahs;
    } catch (error) {
      console.error('🎵 useAutoplay: Failed to load surahs:', error);
      // Fallback with basic surah info
      const fallbackSurahs: SurahMetadata[] = [
        { number: 1, ename: "Al-Fatihah", name: "الفاتحة", tname: "Al-Faatiha", ayas: 7, type: "Meccan" },
        { number: 2, ename: "Al-Baqarah", name: "البقرة", tname: "Al-Baqara", ayas: 286, type: "Medinan" },
        { number: 3, ename: "Ali 'Imran", name: "آل عمران", tname: "Aal-i-Imraan", ayas: 200, type: "Medinan" },
        { number: 4, ename: "An-Nisa", name: "النساء", tname: "An-Nisaa", ayas: 176, type: "Medinan" },
        { number: 5, ename: "Al-Ma'idah", name: "المائدة", tname: "Al-Maaida", ayas: 120, type: "Medinan" },
      ];
      surahsRef.current = fallbackSurahs;
      return fallbackSurahs;
    } finally {
      isLoadingSurahsRef.current = false;
    }
  }, []);

  // Calculate the next verse to play
  const getNextVerse = useCallback(async (currentSurah: number, currentVerseNum: number): Promise<{ surah: number; verse: number; surahName?: string } | null> => {
    const surahs = await loadSurahs();
    const surah = surahs.find(s => s.number === currentSurah);
    
    if (!surah) {
      console.warn('🎵 useAutoplay: Surah not found:', currentSurah);
      return null;
    }

    // Check if there's a next verse in the current surah
    if (currentVerseNum < surah.ayas) {
      const nextVerse = { 
        surah: currentSurah, 
        verse: currentVerseNum + 1,
        surahName: surah.ename
      };
      console.log('🎵 useAutoplay: Next verse in same surah:', nextVerse);
      return nextVerse;
    }

    // End of current surah - could extend to next surah in the future
    console.log('🎵 useAutoplay: Reached end of surah', currentSurah);
    return null;
  }, [loadSurahs]);

  // Handle audio ended event - using useCallback with stable dependencies
  const handleAudioEnded = useCallback(async () => {
    console.log('🎵 useAutoplay: Audio ended event received');
    
    // Check if this is a natural end (not a pause/stop)
    // If the audio is paused, it means user manually paused, so don't autoplay
    if (state.isPaused) {
      console.log('🎵 useAutoplay: Audio was paused by user, not auto-playing next verse');
      return;
    }

    // Check if autoplay is enabled
    if (!settings.autoplay) {
      console.log('🎵 useAutoplay: Autoplay disabled, not playing next verse');
      return;
    }

    // Check if we have current verse information
    if (!currentVerse) {
      console.log('🎵 useAutoplay: No current verse information, cannot determine next verse');
      return;
    }

    // Create a unique key for this verse to prevent duplicate processing
    const verseKey = `${currentVerse.surah}:${currentVerse.verse}`;
    if (lastProcessedVerseRef.current === verseKey) {
      console.log('🎵 useAutoplay: Already processed this verse, skipping');
      return;
    }
    lastProcessedVerseRef.current = verseKey;

    console.log('🎵 useAutoplay: Autoplay enabled:', settings.autoplay);
    console.log('🎵 useAutoplay: Current verse:', currentVerse);

    try {
      // Get the next verse
      const nextVerse = await getNextVerse(currentVerse.surah, currentVerse.verse);
      
      if (nextVerse) {
        console.log('🎵 useAutoplay: Playing next verse:', nextVerse);
        
        // Small delay to ensure smooth transition
        setTimeout(() => {
          controls.play(nextVerse.surah, nextVerse.verse);
          
          // Auto-scroll to the next verse after a short delay
          setTimeout(() => {
            handleAutoScroll(nextVerse, nextVerse.surahName);
          }, 300); // Delay to allow audio to start
        }, 500);
      } else {
        console.log('🎵 useAutoplay: No next verse available, autoplay stopped');
      }
    } catch (error) {
      console.error('🎵 useAutoplay: Error playing next verse:', error);
    }
  }, [settings.autoplay, currentVerse, state.isPaused, getNextVerse, controls, handleAutoScroll]);

  // Set up event listener for audio ended events - stable dependencies
  useEffect(() => {
    console.log('🎵 useAutoplay: Setting up audio ended event listener');
    
    const cleanup = addEventListener('ended', handleAudioEnded);
    
    return () => {
      console.log('🎵 useAutoplay: Cleaning up audio ended event listener');
      cleanup();
    };
  }, [addEventListener, handleAudioEnded]);

  // Preload surahs metadata on mount - only once
  useEffect(() => {
    loadSurahs();
  }, [loadSurahs]);

  // Reset processed verse when verse changes
  useEffect(() => {
    if (currentVerse) {
      const verseKey = `${currentVerse.surah}:${currentVerse.verse}`;
      if (lastProcessedVerseRef.current !== verseKey) {
        lastProcessedVerseRef.current = null; // Reset for new verse
      }
    }
  }, [currentVerse]);

  // Manual scroll to current verse function
  const scrollToCurrentVerse = useCallback(() => {
    if (currentVerse) {
      handleAutoScroll(currentVerse);
    }
  }, [currentVerse, handleAutoScroll]);

  return {
    isAutoplayEnabled: settings.autoplay,
    currentVerse,
    getNextVerse,
    // Auto-scroll functionality
    autoScroll: {
      isEnabled: settings.autoScroll,
      scrollToVerse: handleAutoScroll,
      scrollToCurrentVerse,
      getVerseElementId
    }
  };
}