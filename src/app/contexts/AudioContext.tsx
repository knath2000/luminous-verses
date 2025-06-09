'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import { AudioState, AudioControls, AudioEvent, AudioEventHandler, AudioPlaybackOptions, AudioEventData } from '../types/audio';
import { getVerseAudio, preloadAdjacentVerses } from '../utils/audioPoolManager';
import { getAudioContext } from '../utils/audioUnlock';
import { useUserGesture } from './UserGestureContext';
import { useSettings } from './SettingsContext';

// Audio state management
interface AudioAction {
  type: 'SET_PLAYING' | 'SET_PAUSED' | 'SET_LOADING' | 'SET_TIME' | 'SET_VOLUME' | 'SET_ERROR' | 'RESET';
  playing?: boolean;
  paused?: boolean;
  loading?: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  error?: string | null;
}

const initialState: AudioState = {
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  error: null
};

function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'SET_PLAYING':
      // Only clear isPaused if we're actually starting to play
      return {
        ...state,
        isPlaying: action.playing ?? false,
        isPaused: action.playing ? false : state.isPaused,
        error: null
      };
    case 'SET_PAUSED':
      return { ...state, isPaused: action.paused ?? true, isPlaying: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading ?? false, error: null };
    case 'SET_TIME':
      return {
        ...state,
        currentTime: action.currentTime ?? state.currentTime,
        duration: action.duration ?? state.duration
      };
    case 'SET_VOLUME':
      return { ...state, volume: action.volume ?? state.volume };
    case 'SET_ERROR':
      return { ...state, error: action.error ?? null, isLoading: false, isPlaying: false, isPaused: false };
    case 'RESET':
      return { ...initialState, volume: state.volume };
    default:
      return state;
  }
}

// Context types
interface AudioContextType {
  state: AudioState;
  controls: AudioControls;
  currentVerse: { surah: number; verse: number } | null;
  addEventListener: (event: AudioEvent, handler: AudioEventHandler) => () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: React.ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  
  // Use the proper UserGesture hook and settings
  const { ensureAudioUnlock } = useUserGesture();
  const { settings } = useSettings();

  // Audio nodes and references
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const currentVerseRef = useRef<{ surah: number; verse: number } | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);

  // Event system
  const eventListenersRef = useRef<Map<AudioEvent, Set<AudioEventHandler>>>(new Map());

  /**
   * Add event listener for audio events
   */
  const addEventListener = useCallback((event: AudioEvent, handler: AudioEventHandler): (() => void) => {
    const listeners = eventListenersRef.current;
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(handler);

    // Return cleanup function
    return () => {
      listeners.get(event)?.delete(handler);
    };
  }, []);

  /**
   * Emit audio event to all listeners
   */
  const emitEvent = useCallback((event: AudioEvent, data?: AudioEventData) => {
    const listeners = eventListenersRef.current.get(event);
    if (listeners) {
      listeners.forEach(handler => {
        try {
          handler(event, data);
        } catch (error) {
          console.error('Error in audio event handler:', error);
        }
      });
    }
  }, []);

  /**
   * Update current time during playback
   */
  const updateTime = useCallback(() => {
    if (state.isPlaying && currentSourceRef.current) {
      const audioContext = getAudioContext();
      if (audioContext) {
        const elapsed = audioContext.currentTime - startTimeRef.current + pauseTimeRef.current;
        dispatch({ type: 'SET_TIME', currentTime: elapsed });
        emitEvent('timeupdate', { currentTime: elapsed, duration: state.duration });
      }
    }

    // Continue animation loop if playing
    if (state.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [state.isPlaying, state.duration, emitEvent]);

  /**
   * Start time update loop
   */
  const startTimeUpdates = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    updateTime();
  }, [updateTime]);

  /**
   * Stop time update loop
   */
  const stopTimeUpdates = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Play audio for a specific verse
   */
  const play = useCallback(async (
    surah: number, 
    verse: number, 
    options: AudioPlaybackOptions = {}
  ): Promise<void> => {
    console.log(`🎵 AudioContext: play() called for verse ${surah}:${verse}`);
    try {
      // Ensure audio is unlocked
      console.log('🎵 AudioContext: Ensuring audio unlock...');
      const unlocked = await ensureAudioUnlock();
      console.log('🎵 AudioContext: Audio unlock result:', unlocked);
      if (!unlocked) {
        throw new Error('Audio not unlocked - user interaction required');
      }

      // Get audio context
      console.log('🎵 AudioContext: Getting audio context...');
      const audioContext = getAudioContext();
      console.log('🎵 AudioContext: Audio context result:', audioContext ? 'SUCCESS' : 'FAILED');
      if (!audioContext) {
        throw new Error('AudioContext not available');
      }

      // Stop current playback
      if (currentSourceRef.current) {
        console.log('🎵 AudioContext: Stopping current playback...');
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }

      console.log('🎵 AudioContext: Setting loading state...');
      dispatch({ type: 'SET_LOADING', loading: true });
      emitEvent('loadstart');

      // Get audio buffer
      console.log('🎵 AudioContext: Getting audio buffer...');
      const buffer = await getVerseAudio(surah, verse);
      console.log('🎵 AudioContext: Audio buffer result:', buffer ? 'SUCCESS' : 'FAILED');
      
      // Create audio nodes
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Store references
      currentSourceRef.current = source;
      gainNodeRef.current = gainNode;

      // Set volume (use settings volume if no override provided)
      const volume = options.volume ?? settings.volume ?? state.volume;
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

      // Handle fade in
      if (options.fadeIn && options.fadeInDuration) {
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + options.fadeInDuration);
      }

      // Set up event handlers
      source.onended = () => {
        dispatch({ type: 'SET_PLAYING', playing: false });
        stopTimeUpdates();
        
        // Only emit 'ended' event if this was a natural end, not a manual stop/pause
        if (!isManuallyStoppedRef.current) {
          emitEvent('ended');
        } else {
          console.log('🎵 AudioContext: Source ended due to manual stop/pause, not emitting ended event');
        }
        
        currentSourceRef.current = null;
        gainNodeRef.current = null;
        isManuallyStoppedRef.current = false; // Reset for next playback
      };

      // Start playback
      const startTime = options.startTime ?? 0;
      startTimeRef.current = audioContext.currentTime - startTime;
      pauseTimeRef.current = startTime;
      
      source.start(0, startTime);
      
      // Update state
      currentVerseRef.current = { surah, verse };
      
      emitEvent('loadend');
      emitEvent('play');
      
      dispatch({ type: 'SET_LOADING', loading: false });
      dispatch({ type: 'SET_PLAYING', playing: true });
      dispatch({ type: 'SET_TIME', currentTime: startTime, duration: buffer.duration });
      dispatch({ type: 'SET_VOLUME', volume });

      // Start time updates
      startTimeUpdates();

      // Preload adjacent verses
      preloadAdjacentVerses(surah, verse, 286).catch(error => {
        console.warn('Failed to preload adjacent verses:', error);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown audio error';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      emitEvent('error', { error: errorMessage });
      console.error('Audio playback error:', error);
    }
  }, [ensureAudioUnlock, settings.volume, state.volume, emitEvent, startTimeUpdates, stopTimeUpdates]);

  /**
   * Pause current playback
   */
  const pause = useCallback(() => {
    console.log('🎵 AudioContext: pause() called, isPlaying:', state.isPlaying);
    if (currentSourceRef.current && state.isPlaying) {
      const audioContext = getAudioContext();
      if (audioContext) {
        // Calculate the current playback position correctly
        const currentPlaybackTime = audioContext.currentTime - startTimeRef.current + pauseTimeRef.current;
        pauseTimeRef.current = currentPlaybackTime;
        console.log('🎵 AudioContext: Pausing at time:', currentPlaybackTime);
      }
      
      // Mark as manually stopped to prevent 'ended' event emission
      isManuallyStoppedRef.current = true;
      
      // Stop the current source but keep the verse reference
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
      gainNodeRef.current = null;
      
      // Note: We keep currentVerseRef.current intact so we know which verse is paused
      
      dispatch({ type: 'SET_PAUSED', paused: true });
      stopTimeUpdates();
      emitEvent('pause');
      console.log('🎵 AudioContext: Pause completed, currentVerse preserved:', currentVerseRef.current);
    }
  }, [state.isPlaying, stopTimeUpdates, emitEvent]);

  /**
   * Resume paused playback
   */
  const resume = useCallback(async (): Promise<void> => {
    console.log('🎵 AudioContext: resume() called, isPaused:', state.isPaused, 'currentVerse:', currentVerseRef.current);
    if (!state.isPaused || !currentVerseRef.current) {
      console.log('🎵 AudioContext: Resume conditions not met - isPaused:', state.isPaused, 'currentVerse:', currentVerseRef.current);
      return;
    }

    const { surah, verse } = currentVerseRef.current;
    console.log(`🎵 AudioContext: Resuming verse ${surah}:${verse} from position:`, pauseTimeRef.current);
    
    try {
      // Get audio context
      const audioContext = getAudioContext();
      if (!audioContext) {
        throw new Error('AudioContext not available');
      }

      // Get audio buffer
      const buffer = await getVerseAudio(surah, verse);
      
      // Create new audio nodes
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Store references
      currentSourceRef.current = source;
      gainNodeRef.current = gainNode;

      // Set volume (use settings volume)
      const volume = settings.volume ?? state.volume;
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

      // Set up event handlers
      source.onended = () => {
        dispatch({ type: 'SET_PLAYING', playing: false });
        stopTimeUpdates();
        
        // Only emit 'ended' event if this was a natural end, not a manual stop/pause
        if (!isManuallyStoppedRef.current) {
          emitEvent('ended');
        } else {
          console.log('🎵 AudioContext: Source ended due to manual stop/pause, not emitting ended event');
        }
        
        currentSourceRef.current = null;
        gainNodeRef.current = null;
        isManuallyStoppedRef.current = false; // Reset for next playback
      };

      // Resume from paused position
      const resumeTime = pauseTimeRef.current;
      startTimeRef.current = audioContext.currentTime - resumeTime;
      
      source.start(0, resumeTime);
      
      // Update state
      dispatch({ type: 'SET_PLAYING', playing: true });
      emitEvent('play');
      emitEvent('resume');

      // Start time updates
      startTimeUpdates();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown audio error';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      emitEvent('error', { error: errorMessage });
      console.error('Audio resume error:', error);
    }
  }, [state.isPaused, settings.volume, state.volume, emitEvent, startTimeUpdates, stopTimeUpdates]);

  /**
   * Stop current playback
   */
  const stop = useCallback(() => {
    if (currentSourceRef.current) {
      // Mark as manually stopped to prevent 'ended' event emission
      isManuallyStoppedRef.current = true;
      
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
      gainNodeRef.current = null;
    }

    // Reset all references
    currentVerseRef.current = null;
    startTimeRef.current = 0;
    pauseTimeRef.current = 0;

    dispatch({ type: 'RESET' });
    stopTimeUpdates();
    emitEvent('stop');
  }, [stopTimeUpdates, emitEvent]);

  /**
   * Seek to specific time
   */
  const seek = useCallback(async (time: number) => {
    if (!currentVerseRef.current) return;

    const { surah, verse } = currentVerseRef.current;
    
    // If playing, restart from new position
    if (state.isPlaying) {
      if (currentSourceRef.current) {
        // Mark as manually stopped to prevent 'ended' event emission
        isManuallyStoppedRef.current = true;
        currentSourceRef.current.stop();
      }
      
      // Restart playback from new position
      await play(surah, verse, { startTime: time, volume: settings.volume ?? state.volume });
    } else {
      pauseTimeRef.current = time;
      dispatch({ type: 'SET_TIME', currentTime: time });
    }
  }, [state.isPlaying, settings.volume, state.volume, play]);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (gainNodeRef.current) {
      const audioContext = getAudioContext();
      if (audioContext) {
        gainNodeRef.current.gain.setValueAtTime(clampedVolume, audioContext.currentTime);
      }
    }

    dispatch({ type: 'SET_VOLUME', volume: clampedVolume });
    emitEvent('volumechange', { volume: clampedVolume });
  }, [emitEvent]);

  /**
   * Preload audio for a verse
   */
  const preload = useCallback(async (surah: number, verse: number): Promise<void> => {
    try {
      await getVerseAudio(surah, verse);
    } catch (error) {
      console.warn(`Failed to preload audio for ${surah}:${verse}:`, error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }
      stopTimeUpdates();
    };
  }, [stopTimeUpdates]);

  const controls: AudioControls = useMemo(() => ({
    play,
    pause,
    resume,
    stop,
    seek,
    setVolume,
    preload
  }), [play, pause, resume, stop, seek, setVolume, preload]);

  const contextValue: AudioContextType = {
    state,
    controls,
    currentVerse: currentVerseRef.current,
    addEventListener
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

/**
 * Hook to access audio context
 */
export function useAudio(): AudioContextType {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

/**
 * Hook to access audio controls
 */
export function useAudioControls() {
  const { controls, state, currentVerse } = useAudio();
  
  return {
    ...controls,
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    isLoading: state.isLoading,
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume,
    error: state.error,
    currentVerse
  };
}