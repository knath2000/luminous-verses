'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAudio as useAudioContext, useAudioControls } from '../contexts/AudioContext';
import { useAudioReadiness } from '../contexts/UserGestureContext';
import { AudioEventHandler } from '../types/audio';

/**
 * Enhanced audio hook with additional utilities
 */
export function useAudio() {
  return useAudioContext();
}

/**
 * Hook for playing a specific verse with loading states
 */
export function useVerseAudio(surah: number, verse: number) {
  const { play, pause, resume, isPlaying, isPaused, isLoading, currentVerse, error } = useAudioControls();
  const { ensureReady } = useAudioReadiness();
  const [isCurrentVerse, setIsCurrentVerse] = useState(false);

  // Check if this is the currently playing verse
  useEffect(() => {
    setIsCurrentVerse(
      currentVerse?.surah === surah && currentVerse?.verse === verse
    );
  }, [currentVerse, surah, verse]);

  const playVerse = useCallback(async () => {
    console.log(`🎵 useVerseAudio: Attempting to play verse ${surah}:${verse}`);
    console.log(`🎵 useVerseAudio: State - isCurrentVerse: ${isCurrentVerse}, isPlaying: ${isPlaying}, isPaused: ${isPaused}`);
    console.log(`🎵 useVerseAudio: currentVerse:`, currentVerse);
    
    // Add a small delay to ensure state has propagated
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // If this verse is currently playing, pause it
    if (isCurrentVerse && isPlaying) {
      console.log('🎵 useVerseAudio: Current verse is playing, pausing...');
      pause();
      
      // Wait a bit for state to update
      setTimeout(() => {
        console.log('🎵 useVerseAudio: Post-pause state check - isPaused should be true');
      }, 50);
      return;
    }
    
    // If this verse is paused, resume it
    if (isCurrentVerse && isPaused) {
      console.log('🎵 useVerseAudio: Current verse is paused, resuming...');
      try {
        await resume();
        console.log('🎵 useVerseAudio: Resume completed successfully');
      } catch (error) {
        console.error(`🎵 useVerseAudio: Failed to resume verse ${surah}:${verse}:`, error);
      }
      return;
    }
    
    // Otherwise, start playing this verse (new verse or stopped)
    console.log('🎵 useVerseAudio: Starting new playback...');
    try {
      console.log('🎵 useVerseAudio: Ensuring audio readiness...');
      const ready = await ensureReady();
      console.log('🎵 useVerseAudio: Audio readiness result:', ready);
      if (!ready) {
        throw new Error('Audio not ready - user interaction required');
      }
      console.log('🎵 useVerseAudio: Calling play function...');
      await play(surah, verse);
      console.log('🎵 useVerseAudio: Play function completed successfully');
    } catch (error) {
      console.error(`🎵 useVerseAudio: Failed to play verse ${surah}:${verse}:`, error);
    }
  }, [surah, verse, play, pause, resume, ensureReady, isCurrentVerse, isPlaying, isPaused, currentVerse]);

  return {
    playVerse,
    isPlaying: isCurrentVerse && isPlaying,
    isPaused: isCurrentVerse && isPaused,
    isLoading: isCurrentVerse && isLoading,
    isCurrentVerse,
    error: isCurrentVerse ? error : null
  };
}

/**
 * Hook for audio event handling
 */
export function useAudioEvents() {
  const { addEventListener } = useAudio();

  const onPlay = useCallback((handler: AudioEventHandler) => {
    return addEventListener('play', handler);
  }, [addEventListener]);

  const onPause = useCallback((handler: AudioEventHandler) => {
    return addEventListener('pause', handler);
  }, [addEventListener]);

  const onStop = useCallback((handler: AudioEventHandler) => {
    return addEventListener('stop', handler);
  }, [addEventListener]);

  const onEnded = useCallback((handler: AudioEventHandler) => {
    return addEventListener('ended', handler);
  }, [addEventListener]);

  const onError = useCallback((handler: AudioEventHandler) => {
    return addEventListener('error', handler);
  }, [addEventListener]);

  const onTimeUpdate = useCallback((handler: AudioEventHandler) => {
    return addEventListener('timeupdate', handler);
  }, [addEventListener]);

  const onVolumeChange = useCallback((handler: AudioEventHandler) => {
    return addEventListener('volumechange', handler);
  }, [addEventListener]);

  return {
    onPlay,
    onPause,
    onStop,
    onEnded,
    onError,
    onTimeUpdate,
    onVolumeChange
  };
}

/**
 * Hook for audio progress tracking
 */
export function useAudioProgress() {
  const { currentTime, duration } = useAudioControls();
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (duration > 0) {
      const progressPercent = (currentTime / duration) * 100;
      setProgress(Math.min(100, Math.max(0, progressPercent)));
      setTimeRemaining(duration - currentTime);
    } else {
      setProgress(0);
      setTimeRemaining(0);
    }
  }, [currentTime, duration]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    progress,
    currentTime,
    duration,
    timeRemaining,
    formatTime,
    formattedCurrentTime: formatTime(currentTime),
    formattedDuration: formatTime(duration),
    formattedTimeRemaining: formatTime(timeRemaining)
  };
}

/**
 * Hook for volume control with persistence
 */
export function useVolumeControl() {
  const { setVolume, volume } = useAudioControls();
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  // Load saved volume from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('luminous-verses-volume');
    if (savedVolume) {
      const parsedVolume = parseFloat(savedVolume);
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
        setVolume(parsedVolume);
      }
    }
  }, [setVolume]);

  // Save volume to localStorage
  useEffect(() => {
    localStorage.setItem('luminous-verses-volume', volume.toString());
  }, [volume]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume, previousVolume, setVolume]);

  const changeVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    
    if (clampedVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [setVolume, isMuted]);

  return {
    volume,
    isMuted,
    toggleMute,
    changeVolume,
    volumePercent: Math.round(volume * 100)
  };
}

/**
 * Hook for keyboard shortcuts
 */
export function useAudioKeyboardShortcuts() {
  const { play, pause, stop, seek } = useAudioControls();
  const { changeVolume, volume } = useVolumeControl();
  const { currentVerse, isPlaying, currentTime, duration } = useAudioControls();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isPlaying) {
            pause();
          } else if (currentVerse) {
            play(currentVerse.surah, currentVerse.verse);
          }
          break;

        case 'Escape':
          event.preventDefault();
          stop();
          break;

        case 'ArrowLeft':
          if (event.shiftKey) {
            event.preventDefault();
            const newTime = Math.max(0, currentTime - 10);
            seek(newTime);
          }
          break;

        case 'ArrowRight':
          if (event.shiftKey) {
            event.preventDefault();
            const newTime = Math.min(duration, currentTime + 10);
            seek(newTime);
          }
          break;

        case 'ArrowUp':
          if (event.shiftKey) {
            event.preventDefault();
            changeVolume(Math.min(1, volume + 0.1));
          }
          break;

        case 'ArrowDown':
          if (event.shiftKey) {
            event.preventDefault();
            changeVolume(Math.max(0, volume - 0.1));
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [play, pause, stop, seek, changeVolume, currentVerse, isPlaying, currentTime, duration, volume]);
}

/**
 * Hook for audio loading states across multiple verses
 */
export function useAudioLoadingStates() {
  const [loadingVerses] = useState<Set<string>>(new Set());
  const { addEventListener } = useAudio();

  useEffect(() => {
    const cleanup = addEventListener('loadstart', () => {
      // This would need to be enhanced to track specific verses
      // For now, we'll use a simple loading state
    });

    return cleanup;
  }, [addEventListener]);

  const isVerseLoading = useCallback((surah: number, verse: number): boolean => {
    const key = `${surah}:${verse}`;
    return loadingVerses.has(key);
  }, [loadingVerses]);

  return {
    isVerseLoading,
    hasLoadingVerses: loadingVerses.size > 0
  };
}

/**
 * Hook for audio error handling
 */
export function useAudioErrorHandling() {
  const [lastError, setLastError] = useState<string | null>(null);
  const { addEventListener } = useAudio();

  useEffect(() => {
    const cleanup = addEventListener('error', (_, data) => {
      const errorMessage = data?.error
        ? (typeof data.error === 'string' ? data.error : data.error.message)
        : 'Unknown audio error';
      setLastError(errorMessage);
    });

    return cleanup;
  }, [addEventListener]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    lastError,
    clearError,
    hasError: lastError !== null
  };
}