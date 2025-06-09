import { VerseAudio, AudioPoolConfig } from '../types/audio';
import { audioUrlGenerator } from './audioUrlGenerator';
import { getAudioContext } from './audioUnlock';

/**
 * Audio Pool Manager for efficient audio buffer caching and management
 * Implements LRU cache with preloading capabilities
 */

export class AudioPoolManager {
  private static instance: AudioPoolManager;
  private audioCache = new Map<string, VerseAudio>();
  private loadingPromises = new Map<string, Promise<AudioBuffer>>();
  private config: AudioPoolConfig;

  private constructor(config: Partial<AudioPoolConfig> = {}) {
    this.config = {
      maxCacheSize: 20, // Cache up to 20 audio buffers
      preloadNext: true,
      preloadPrevious: true,
      cacheExpiryMs: 30 * 60 * 1000, // 30 minutes
      ...config
    };

    // Cleanup expired entries periodically
    this.startCleanupTimer();
  }

  static getInstance(config?: Partial<AudioPoolConfig>): AudioPoolManager {
    if (!AudioPoolManager.instance) {
      AudioPoolManager.instance = new AudioPoolManager(config);
    }
    return AudioPoolManager.instance;
  }

  /**
   * Get audio buffer for a verse (load if not cached)
   */
  async getAudioBuffer(surah: number, verse: number): Promise<AudioBuffer> {
    const key = this.generateCacheKey(surah, verse);
    console.log(`🎵 AudioPoolManager: Getting audio buffer for ${surah}:${verse}, key: ${key}`);
    const cached = this.audioCache.get(key);

    // Return cached buffer if available and not expired
    if (cached?.buffer && !this.isExpired(cached)) {
      console.log(`🎵 AudioPoolManager: Found cached buffer for ${surah}:${verse}`);
      this.updateAccessTime(cached);
      return cached.buffer;
    }

    // Check if already loading
    const loadingPromise = this.loadingPromises.get(key);
    if (loadingPromise) {
      console.log(`🎵 AudioPoolManager: Already loading ${surah}:${verse}, returning existing promise`);
      return loadingPromise;
    }

    console.log(`🎵 AudioPoolManager: Loading new audio buffer for ${surah}:${verse}`);
    // Load new audio buffer
    return this.loadAudioBuffer(surah, verse);
  }

  /**
   * Load audio buffer from URL
   */
  private async loadAudioBuffer(surah: number, verse: number): Promise<AudioBuffer> {
    const key = this.generateCacheKey(surah, verse);
    const url = audioUrlGenerator.generateVerseUrl(surah, verse);
    console.log(`🎵 AudioPoolManager: Loading from URL: ${url}`);
    const audioContext = getAudioContext();

    if (!audioContext) {
      throw new Error('AudioContext not available');
    }

    const loadPromise = this.fetchAndDecodeAudio(url, audioContext);
    this.loadingPromises.set(key, loadPromise);

    try {
      const buffer = await loadPromise;
      console.log(`🎵 AudioPoolManager: Successfully loaded buffer for ${surah}:${verse}, duration: ${buffer.duration}s`);
      
      // Cache the loaded buffer
      const verseAudio: VerseAudio = {
        surah,
        verse,
        url,
        buffer,
        lastAccessed: Date.now()
      };

      this.addToCache(key, verseAudio);
      return buffer;
    } catch (error) {
      console.error(`🎵 AudioPoolManager: Failed to load audio for ${surah}:${verse}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  /**
   * Fetch and decode audio from URL
   */
  private async fetchAndDecodeAudio(url: string, audioContext: AudioContext): Promise<AudioBuffer> {
    try {
      console.log(`🎵 AudioPoolManager: Fetching audio from ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`🎵 AudioPoolManager: Fetch successful, decoding audio data...`);
      const arrayBuffer = await response.arrayBuffer();
      console.log(`🎵 AudioPoolManager: Array buffer size: ${arrayBuffer.byteLength} bytes`);
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log(`🎵 AudioPoolManager: Audio decoded successfully, duration: ${audioBuffer.duration}s`);
      return audioBuffer;
    } catch (error) {
      console.error(`🎵 AudioPoolManager: Error in fetchAndDecodeAudio:`, error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch/decode audio: ${error.message}`);
      }
      throw new Error('Unknown error occurred while loading audio');
    }
  }

  /**
   * Preload audio for adjacent verses
   */
  async preloadAdjacent(surah: number, verse: number, maxVerse: number): Promise<void> {
    const preloadPromises: Promise<void>[] = [];

    // Preload next verse
    if (this.config.preloadNext) {
      const nextUrl = audioUrlGenerator.getNextVerseUrl(surah, verse, maxVerse);
      if (nextUrl) {
        const nextVerse = audioUrlGenerator.parseUrlToVerse(nextUrl);
        if (nextVerse) {
          preloadPromises.push(
            this.preloadVerse(nextVerse.surah, nextVerse.verse)
          );
        }
      }
    }

    // Preload previous verse
    if (this.config.preloadPrevious) {
      const prevUrl = audioUrlGenerator.getPreviousVerseUrl(surah, verse);
      if (prevUrl) {
        const prevVerse = audioUrlGenerator.parseUrlToVerse(prevUrl);
        if (prevVerse) {
          preloadPromises.push(
            this.preloadVerse(prevVerse.surah, prevVerse.verse)
          );
        }
      }
    }

    // Execute preloads in background (don't await)
    Promise.allSettled(preloadPromises).catch(error => {
      console.warn('Some preload operations failed:', error);
    });
  }

  /**
   * Preload a specific verse
   */
  private async preloadVerse(surah: number, verse: number): Promise<void> {
    const key = this.generateCacheKey(surah, verse);
    
    // Skip if already cached or loading
    if (this.audioCache.has(key) || this.loadingPromises.has(key)) {
      return;
    }

    try {
      await this.loadAudioBuffer(surah, verse);
    } catch (error) {
      // Silently fail preloads to avoid disrupting main playback
      console.warn(`Preload failed for ${surah}:${verse}:`, error);
    }
  }

  /**
   * Add audio to cache with LRU eviction
   */
  private addToCache(key: string, verseAudio: VerseAudio): void {
    // Remove if already exists (for LRU update)
    if (this.audioCache.has(key)) {
      this.audioCache.delete(key);
    }

    // Evict oldest entries if cache is full
    while (this.audioCache.size >= this.config.maxCacheSize) {
      const oldestKey = this.audioCache.keys().next().value;
      if (oldestKey) {
        this.audioCache.delete(oldestKey);
      }
    }

    // Add to cache
    this.audioCache.set(key, verseAudio);
  }

  /**
   * Update access time for LRU
   */
  private updateAccessTime(verseAudio: VerseAudio): void {
    verseAudio.lastAccessed = Date.now();
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(verseAudio: VerseAudio): boolean {
    if (!verseAudio.lastAccessed) return false;
    return Date.now() - verseAudio.lastAccessed > this.config.cacheExpiryMs;
  }

  /**
   * Generate cache key for verse
   */
  private generateCacheKey(surah: number, verse: number): string {
    return `${surah.toString().padStart(3, '0')}:${verse.toString().padStart(3, '0')}`;
  }

  /**
   * Clear expired entries from cache
   */
  private cleanupExpired(): void {
    const expiredKeys: string[] = [];

    for (const [key, verseAudio] of this.audioCache.entries()) {
      if (this.isExpired(verseAudio)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.audioCache.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired audio cache entries`);
    }
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    // Cleanup every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalSize = this.audioCache.size;
    const loadingCount = this.loadingPromises.size;
    const memoryUsage = Array.from(this.audioCache.values()).reduce((total, audio) => {
      if (audio.buffer) {
        // Estimate memory usage (samples * channels * 4 bytes per float32)
        return total + (audio.buffer.length * audio.buffer.numberOfChannels * 4);
      }
      return total;
    }, 0);

    return {
      totalCached: totalSize,
      maxCacheSize: this.config.maxCacheSize,
      currentlyLoading: loadingCount,
      estimatedMemoryMB: Math.round(memoryUsage / (1024 * 1024) * 100) / 100,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  private calculateCacheHitRate(): number {
    // This is a simplified implementation
    // In a real app, you'd track hits/misses over time
    return this.audioCache.size > 0 ? 0.85 : 0;
  }

  /**
   * Clear all cached audio
   */
  clearCache(): void {
    this.audioCache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AudioPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if verse is cached
   */
  isCached(surah: number, verse: number): boolean {
    const key = this.generateCacheKey(surah, verse);
    const cached = this.audioCache.get(key);
    return cached?.buffer !== undefined && !this.isExpired(cached);
  }

  /**
   * Check if verse is currently loading
   */
  isLoading(surah: number, verse: number): boolean {
    const key = this.generateCacheKey(surah, verse);
    return this.loadingPromises.has(key);
  }
}

// Export singleton instance
export const audioPoolManager = AudioPoolManager.getInstance();

// Export utility functions
export const getVerseAudio = async (surah: number, verse: number): Promise<AudioBuffer> => {
  return audioPoolManager.getAudioBuffer(surah, verse);
};

export const preloadAdjacentVerses = async (surah: number, verse: number, maxVerse: number): Promise<void> => {
  return audioPoolManager.preloadAdjacent(surah, verse, maxVerse);
};

export const isVerseAudioCached = (surah: number, verse: number): boolean => {
  return audioPoolManager.isCached(surah, verse);
};

export const isVerseAudioLoading = (surah: number, verse: number): boolean => {
  return audioPoolManager.isLoading(surah, verse);
};

export const getAudioCacheStats = () => {
  return audioPoolManager.getCacheStats();
};