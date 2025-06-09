'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserGestureState } from '../types/audio';
import { unlockAudio, onAudioUnlock } from '../utils/audioUnlock';

interface UserGestureContextType {
  gestureState: UserGestureState;
  recordInteraction: () => void;
  ensureAudioUnlock: () => Promise<boolean>;
  isAudioReady: boolean;
}

const UserGestureContext = createContext<UserGestureContextType | undefined>(undefined);

interface UserGestureProviderProps {
  children: React.ReactNode;
}

export function UserGestureProvider({ children }: UserGestureProviderProps) {
  const [gestureState, setGestureState] = useState<UserGestureState>({
    hasInteracted: false,
    audioUnlocked: false,
    lastInteraction: null
  });

  const [isAudioReady, setIsAudioReady] = useState(false);

  /**
   * Record user interaction and attempt audio unlock
   */
  const recordInteraction = useCallback(async () => {
    const now = Date.now();
    
    setGestureState(prev => ({
      ...prev,
      hasInteracted: true,
      lastInteraction: now
    }));

    // Attempt to unlock audio on interaction
    try {
      const unlocked = await unlockAudio();
      if (unlocked) {
        setGestureState(prev => ({
          ...prev,
          audioUnlocked: true
        }));
        setIsAudioReady(true);
      }
    } catch (error) {
      console.warn('Failed to unlock audio on interaction:', error);
    }
  }, []);

  /**
   * Ensure audio is unlocked (call before playing audio)
   */
  const ensureAudioUnlock = useCallback(async (): Promise<boolean> => {
    if (gestureState.audioUnlocked) {
      return true;
    }

    try {
      const unlocked = await unlockAudio();
      if (unlocked) {
        setGestureState(prev => ({
          ...prev,
          audioUnlocked: true
        }));
        setIsAudioReady(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unlock audio:', error);
      return false;
    }
  }, [gestureState.audioUnlocked]);

  /**
   * Setup global interaction listeners
   */
  useEffect(() => {
    const interactionEvents = [
      'click',
      'touchstart',
      'touchend',
      'mousedown',
      'keydown'
    ];

    const handleInteraction = () => {
      if (!gestureState.hasInteracted) {
        recordInteraction();
      }
    };

    // Add listeners for first interaction
    interactionEvents.forEach(event => {
      document.addEventListener(event, handleInteraction, { 
        passive: true, 
        once: true 
      });
    });

    return () => {
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [gestureState.hasInteracted, recordInteraction]);

  /**
   * Listen for audio unlock events
   */
  useEffect(() => {
    const cleanup = onAudioUnlock(() => {
      setGestureState(prev => ({
        ...prev,
        audioUnlocked: true
      }));
      setIsAudioReady(true);
    });

    return cleanup;
  }, []);

  /**
   * Update audio ready state based on gesture state
   */
  useEffect(() => {
    setIsAudioReady(gestureState.hasInteracted && gestureState.audioUnlocked);
  }, [gestureState.hasInteracted, gestureState.audioUnlocked]);

  const contextValue: UserGestureContextType = {
    gestureState,
    recordInteraction,
    ensureAudioUnlock,
    isAudioReady
  };

  return (
    <UserGestureContext.Provider value={contextValue}>
      {children}
    </UserGestureContext.Provider>
  );
}

/**
 * Hook to use user gesture context
 */
export function useUserGesture(): UserGestureContextType {
  const context = useContext(UserGestureContext);
  if (context === undefined) {
    throw new Error('useUserGesture must be used within a UserGestureProvider');
  }
  return context;
}

/**
 * Hook to ensure audio is ready before playback
 */
export function useAudioReadiness() {
  const { isAudioReady, ensureAudioUnlock, gestureState } = useUserGesture();

  const ensureReady = useCallback(async (): Promise<boolean> => {
    if (isAudioReady) {
      return true;
    }

    // If user hasn't interacted, we can't unlock audio
    if (!gestureState.hasInteracted) {
      console.warn('Audio playback requires user interaction first');
      return false;
    }

    // Try to unlock audio
    return await ensureAudioUnlock();
  }, [isAudioReady, gestureState.hasInteracted, ensureAudioUnlock]);

  return {
    isAudioReady,
    ensureReady,
    hasInteracted: gestureState.hasInteracted,
    audioUnlocked: gestureState.audioUnlocked
  };
}

/**
 * Higher-order component to wrap components that need audio interaction
 */
export function withAudioInteraction<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AudioInteractionWrapper(props: P) {
    const { recordInteraction } = useUserGesture();

    return (
      <div onClick={recordInteraction} onTouchStart={recordInteraction}>
        <Component {...props} />
      </div>
    );
  };
}

/**
 * Component to display audio readiness status (for debugging)
 */
export function AudioReadinessIndicator() {
  const { gestureState, isAudioReady } = useUserGesture();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono">
      <div>Interacted: {gestureState.hasInteracted ? '✓' : '✗'}</div>
      <div>Audio Unlocked: {gestureState.audioUnlocked ? '✓' : '✗'}</div>
      <div>Audio Ready: {isAudioReady ? '✓' : '✗'}</div>
      {gestureState.lastInteraction && (
        <div>Last: {new Date(gestureState.lastInteraction).toLocaleTimeString()}</div>
      )}
    </div>
  );
}