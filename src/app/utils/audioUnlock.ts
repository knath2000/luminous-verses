import { BROWSER_SUPPORT } from '../types/audio';

/**
 * Audio unlock utilities for iOS Safari and mobile browsers
 * Handles the requirement for user gesture before audio playback
 */

export class AudioUnlockManager {
  private static instance: AudioUnlockManager;
  private audioContext: AudioContext | null = null;
  private isUnlocked = false;
  private unlockPromise: Promise<void> | null = null;
  private eventListeners: Set<() => void> = new Set();

  private constructor() {
    this.initializeAudioContext();
    this.setupUnlockListeners();
  }

  static getInstance(): AudioUnlockManager {
    if (!AudioUnlockManager.instance) {
      AudioUnlockManager.instance = new AudioUnlockManager();
    }
    return AudioUnlockManager.instance;
  }

  /**
   * Initialize AudioContext with proper browser compatibility
   */
  private initializeAudioContext(): void {
    if (!BROWSER_SUPPORT.webAudio) {
      console.warn('Web Audio API not supported in this browser');
      return;
    }

    try {
      // Use webkit prefix for older Safari versions
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Check if context is already running (some browsers auto-unlock)
      if (this.audioContext.state === 'running') {
        this.isUnlocked = true;
      }
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
    }
  }

  /**
   * Setup event listeners for user interaction
   */
  private setupUnlockListeners(): void {
    if (typeof window === 'undefined') return;

    const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
    
    const unlockHandler = () => {
      this.attemptUnlock();
    };

    unlockEvents.forEach(event => {
      document.addEventListener(event, unlockHandler, { once: true, passive: true });
    });
  }

  /**
   * Attempt to unlock audio context
   */
  private async attemptUnlock(): Promise<void> {
    if (this.isUnlocked || !this.audioContext) {
      return;
    }

    // Prevent multiple simultaneous unlock attempts
    if (this.unlockPromise) {
      return this.unlockPromise;
    }

    this.unlockPromise = this.performUnlock();
    
    try {
      await this.unlockPromise;
    } finally {
      this.unlockPromise = null;
    }
  }

  /**
   * Perform the actual unlock process
   */
  private async performUnlock(): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Resume the audio context
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create a silent buffer and play it to fully unlock
      await this.playSilentBuffer();

      this.isUnlocked = true;
      this.notifyUnlockListeners();
      
      console.log('Audio context unlocked successfully');
    } catch (error) {
      console.error('Failed to unlock audio context:', error);
      throw error;
    }
  }

  /**
   * Play a silent buffer to ensure audio is fully unlocked
   */
  private async playSilentBuffer(): Promise<void> {
    if (!this.audioContext) return;

    return new Promise((resolve, reject) => {
      try {
        // Create a silent buffer (1 sample at 44.1kHz)
        const buffer = this.audioContext!.createBuffer(1, 1, 44100);
        const source = this.audioContext!.createBufferSource();
        
        source.buffer = buffer;
        source.connect(this.audioContext!.destination);
        
        source.onended = () => resolve();
        source.start(0);
        
        // Fallback timeout
        setTimeout(() => resolve(), 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get the audio context (create if needed)
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Check if audio is unlocked
   */
  isAudioUnlocked(): boolean {
    return this.isUnlocked && this.audioContext?.state === 'running';
  }

  /**
   * Force unlock attempt (call on user interaction)
   */
  async unlock(): Promise<boolean> {
    try {
      await this.attemptUnlock();
      return this.isUnlocked;
    } catch {
      return false;
    }
  }

  /**
   * Add listener for unlock events
   */
  onUnlock(callback: () => void): () => void {
    this.eventListeners.add(callback);
    
    // If already unlocked, call immediately
    if (this.isUnlocked) {
      callback();
    }
    
    // Return cleanup function
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  /**
   * Notify all unlock listeners
   */
  private notifyUnlockListeners(): void {
    this.eventListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in unlock listener:', error);
      }
    });
  }

  /**
   * Check browser audio capabilities
   */
  getAudioCapabilities() {
    return {
      webAudio: BROWSER_SUPPORT.webAudio,
      htmlAudio: BROWSER_SUPPORT.htmlAudio,
      contextState: this.audioContext?.state || 'unavailable',
      isUnlocked: this.isUnlocked,
      sampleRate: this.audioContext?.sampleRate || 0,
      maxChannelCount: this.audioContext?.destination?.maxChannelCount || 0
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.eventListeners.clear();
    this.audioContext = null;
    this.isUnlocked = false;
  }
}

// Export singleton instance
export const audioUnlockManager = AudioUnlockManager.getInstance();

// Export utility functions
export const unlockAudio = async (): Promise<boolean> => {
  return audioUnlockManager.unlock();
};

export const isAudioUnlocked = (): boolean => {
  return audioUnlockManager.isAudioUnlocked();
};

export const getAudioContext = (): AudioContext | null => {
  return audioUnlockManager.getAudioContext();
};

export const onAudioUnlock = (callback: () => void): (() => void) => {
  return audioUnlockManager.onUnlock(callback);
};

// iOS-specific unlock using unmute-ios-audio pattern
export const enableIOSAudio = (): void => {
  if (typeof window === 'undefined') return;

  // Create a simple unlock mechanism for iOS
  const unlockIOS = () => {
    const audioContext = getAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  };

  // Listen for the first user interaction
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
  const unlock = () => {
    unlockIOS();
    events.forEach(event => {
      document.removeEventListener(event, unlock);
    });
  };

  events.forEach(event => {
    document.addEventListener(event, unlock, { passive: true });
  });
};

// Auto-initialize iOS audio unlock
if (typeof window !== 'undefined') {
  enableIOSAudio();
}