import { DEFAULT_RECITER, ReciterInfo } from '../types/audio';

/**
 * Generates audio URLs for Quranic verses from Vercel Blob Storage
 * URL Format: {baseUrl}{surahNumber:3digits}{verseNumber:3digits}.mp3
 * Example: https://h2zfzwpeaxcsfu9s.public.blob.vercel-storage.com/quran-audio/alafasy128/001007.mp3
 */

export class AudioUrlGenerator {
  private reciter: ReciterInfo;

  constructor(reciter: ReciterInfo = DEFAULT_RECITER) {
    this.reciter = reciter;
  }

  /**
   * Generate audio URL for a specific verse
   */
  generateVerseUrl(surah: number, verse: number): string {
    if (!this.isValidSurah(surah)) {
      throw new Error(`Invalid surah number: ${surah}. Must be between 1 and 114.`);
    }

    if (!this.isValidVerse(verse)) {
      throw new Error(`Invalid verse number: ${verse}. Must be greater than 0.`);
    }

    const surahPadded = surah.toString().padStart(3, '0');
    const versePadded = verse.toString().padStart(3, '0');
    const fileName = `${surahPadded}${versePadded}.mp3`;
    
    return `${this.reciter.baseUrl}${fileName}`;
  }

  /**
   * Generate URLs for a range of verses
   */
  generateVerseRangeUrls(surah: number, startVerse: number, endVerse: number): string[] {
    const urls: string[] = [];
    
    for (let verse = startVerse; verse <= endVerse; verse++) {
      urls.push(this.generateVerseUrl(surah, verse));
    }
    
    return urls;
  }

  /**
   * Generate URLs for an entire Surah
   */
  generateSurahUrls(surah: number, verseCount: number): string[] {
    return this.generateVerseRangeUrls(surah, 1, verseCount);
  }

  /**
   * Parse verse information from URL
   */
  parseUrlToVerse(url: string): { surah: number; verse: number } | null {
    try {
      // Extract filename from URL
      const fileName = url.split('/').pop();
      if (!fileName || !fileName.endsWith('.mp3')) {
        return null;
      }

      // Remove .mp3 extension
      const nameWithoutExt = fileName.replace('.mp3', '');
      
      // Extract surah and verse (format: SSSV VV)
      if (nameWithoutExt.length !== 6) {
        return null;
      }

      const surah = parseInt(nameWithoutExt.substring(0, 3), 10);
      const verse = parseInt(nameWithoutExt.substring(3, 6), 10);

      if (this.isValidSurah(surah) && this.isValidVerse(verse)) {
        return { surah, verse };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get next verse URL
   */
  getNextVerseUrl(surah: number, verse: number, maxVerse: number): string | null {
    if (verse < maxVerse) {
      return this.generateVerseUrl(surah, verse + 1);
    }
    
    // Move to next surah if available
    if (surah < 114) {
      return this.generateVerseUrl(surah + 1, 1);
    }
    
    return null; // End of Quran
  }

  /**
   * Get previous verse URL
   */
  getPreviousVerseUrl(surah: number, verse: number): string | null {
    if (verse > 1) {
      return this.generateVerseUrl(surah, verse - 1);
    }
    
    // Move to previous surah if available
    if (surah > 1) {
      // Note: Would need verse count for previous surah
      // For now, return null - this can be enhanced with surah metadata
      return null;
    }
    
    return null; // Beginning of Quran
  }

  /**
   * Change reciter
   */
  setReciter(reciter: ReciterInfo): void {
    this.reciter = reciter;
  }

  /**
   * Get current reciter
   */
  getReciter(): ReciterInfo {
    return this.reciter;
  }

  /**
   * Validate surah number (1-114)
   */
  private isValidSurah(surah: number): boolean {
    return Number.isInteger(surah) && surah >= 1 && surah <= 114;
  }

  /**
   * Validate verse number (must be positive)
   */
  private isValidVerse(verse: number): boolean {
    return Number.isInteger(verse) && verse >= 1;
  }

  /**
   * Generate preload URLs for adjacent verses
   */
  generatePreloadUrls(surah: number, verse: number, maxVerse: number): {
    next: string | null;
    previous: string | null;
  } {
    return {
      next: this.getNextVerseUrl(surah, verse, maxVerse),
      previous: this.getPreviousVerseUrl(surah, verse)
    };
  }

  /**
   * Validate if URL is from current reciter
   */
  isValidReciterUrl(url: string): boolean {
    return url.startsWith(this.reciter.baseUrl);
  }
}

// Export singleton instance
export const audioUrlGenerator = new AudioUrlGenerator();

// Export utility functions
export const generateVerseAudioUrl = (surah: number, verse: number): string => {
  return audioUrlGenerator.generateVerseUrl(surah, verse);
};

export const parseAudioUrl = (url: string) => {
  return audioUrlGenerator.parseUrlToVerse(url);
};