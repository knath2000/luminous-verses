// Quran API utilities for fetching verses, surahs, and translations from our Neon database

// API Response interfaces
interface ApiVerseResponse {
  id: number;
  surahId: number;
  numberInSurah: number;
  text: string;
  juz?: number;
  hizbQuarter?: number;
  sajda?: boolean;
}

interface BatchApiResponse {
  success: boolean;
  data: {
    surahId: number;
    verses: Array<{
      id: number;
      surahId: number;
      numberInSurah: number;
      text: string;
      translation?: string;
      transliteration?: {
        raw?: string;
        clean?: string;
        formatted?: string;
      };
    }>;
    pagination: {
      start: number;
      end: number;
      total: number;
      hasMore: boolean;
    };
  };
}

export interface SurahMetadata {
  number: number;
  name: string; // Arabic name
  ename: string; // English name
  tname: string; // Transliterated name
  ayas: number; // Number of verses
  type: string; // Meccan/Medinan
  order?: number;
  rukus?: number;
  startIndex?: number;
}

export interface VerseData {
  id: number;
  surahId: number;
  numberInSurah: number;
  text: string; // Arabic text
  translation?: string; // English translation
  transliteration?: string; // Transliteration
  juz?: number;
  hizbQuarter?: number;
  sajda?: boolean;
  text_uthmani?: string; // Added for consistency with API response
}

export interface TransliterationData {
  raw?: string;
  clean?: string;
  formatted?: string;
}

export interface TransliterationResponse {
  success: boolean;
  data: {
    surahId: number;
    ayahId?: number;
    totalVerses?: number;
    verses?: Array<{
      ayahId: number;
      transliteration: TransliterationData;
    }>;
    transliteration?: TransliterationData;
    source?: string;
  };
  pagination?: {
    start: number;
    end: number;
    total: number;
  };
}

export interface SurahDescription {
  success: boolean;
  source: string;
  surah: {
    id: number;
    name: {
      arabic: string;
      transliteration: string;
      english: string;
    };
    description: string;
    metadata: {
      totalVerses: number;
      revelationType: string;
      chronologicalOrder: number;
      rukus: number;
      lastUpdated: string;
    };
  };
}

const API_BASE = 'https://luminous-verses-api-tan.vercel.app'; // Our own Neon database API

// Cache for API responses to avoid repeated requests
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch transliterations for a specific verse or surah
 */
export async function fetchTransliterations(
  surahNumber: number,
  verseNumber?: number,
  format: 'raw' | 'clean' | 'formatted' | 'all' = 'all'
): Promise<TransliterationResponse> {
  const cacheKey = `transliteration-${surahNumber}-${verseNumber || 'all'}-${format}`;
  const cached = getCachedData<TransliterationResponse>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      surah: surahNumber.toString(),
      format
    });
    
    if (verseNumber) {
      params.append('ayah', verseNumber.toString());
    }

    const response = await fetch(`${API_BASE}/api/v1/get-transliterations?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transliterations: ${response.status}`);
    }
    
    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
    
  } catch (error) {
    console.error('Error fetching transliterations:', error);
    throw error;
  }
}

/**
 * Fetch all surahs metadata from our Neon database
 */
export async function fetchSurahs(): Promise<SurahMetadata[]> {
  const cacheKey = 'surahs-metadata';
  const cached = getCachedData<SurahMetadata[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/api/v1/get-metadata?type=surah-list`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch surahs: ${response.status}`);
    }
    
    const surahsData = await response.json();
    
    if (!Array.isArray(surahsData)) {
      throw new Error('Invalid surahs data structure');
    }

    setCachedData(cacheKey, surahsData);
    return surahsData;
    
  } catch (error) {
    console.error('Error fetching surahs:', error);
    throw error;
  }
}

/**
 * Fetch verses for a specific surah from our Neon database
 */
export async function fetchVerses(surahNumber: number): Promise<VerseData[]> {
  const cacheKey = `verses-${surahNumber}`;
  const cached = getCachedData<VerseData[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/api/v1/get-verses?surah=${surahNumber}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verses: ${response.status}`);
    }
    
    const versesData = await response.json();
    
    if (!Array.isArray(versesData)) {
      throw new Error('Invalid verses data structure');
    }

    setCachedData(cacheKey, versesData);
    return versesData;
    
  } catch (error) {
    console.error('Error fetching verses:', error);
    throw error;
  }
}

/**
 * Fetch a single verse with translation and transliteration
 */
export async function fetchVerseWithTranslation(
  surahNumber: number, 
  verseNumber: number,
  translator: string = 'en.yusufali',
  includeTransliteration: boolean = true
): Promise<VerseData> {
  const cacheKey = `verse-${surahNumber}-${verseNumber}-${translator}-${includeTransliteration}`;
  const cached = getCachedData<VerseData>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch Arabic text from our API
    const arabicResponse = await fetch(`${API_BASE}/api/v1/get-verses?surah=${surahNumber}`);
    if (!arabicResponse.ok) {
      throw new Error(`Failed to fetch arabic verses: ${arabicResponse.status}`);
    }
    const arabicVerses = await arabicResponse.json();
    const arabicVerse = arabicVerses.find((v: ApiVerseResponse) => v.numberInSurah === verseNumber);
    
    if (!arabicVerse) {
      throw new Error(`Verse ${surahNumber}:${verseNumber} not found`);
    }

    // Fetch translation from our API
    const translationResponse = await fetch(`${API_BASE}/api/v1/get-translated-verse?surah=${surahNumber}&ayah=${verseNumber}&translator=${translator}`);
    let translation = 'Translation not available';
    
    if (translationResponse.ok) {
      const translationData = await translationResponse.json();
      translation = translationData.translation || translation;
    }

    let transliterationText: string | undefined;

    // Fetch transliteration if requested
    if (includeTransliteration) {
      try {
        const transliterationResponse = await fetchTransliterations(surahNumber, verseNumber, 'clean');
        if (transliterationResponse.success && transliterationResponse.data.transliteration?.clean) {
          transliterationText = transliterationResponse.data.transliteration.clean;
        }
      } catch (error) {
        console.warn('Failed to fetch transliteration:', error);
        // Continue without transliteration
      }
    }

    const verseData: VerseData = {
      id: arabicVerse.id,
      surahId: arabicVerse.surahId,
      numberInSurah: arabicVerse.numberInSurah,
      text: arabicVerse.text,
      translation: translation,
      transliteration: transliterationText,
      juz: arabicVerse.juz,
      hizbQuarter: arabicVerse.hizbQuarter,
      sajda: arabicVerse.sajda,
      text_uthmani: arabicVerse.text_uthmani, // Assuming text_uthmani is available in ApiVerseResponse
    };

    setCachedData(cacheKey, verseData);
    return verseData;
    
  } catch (error) {
    console.error('Error fetching verse with translation:', error);
    throw error;
  }
}

/**
 * Fetch verses in batches for optimal performance (NEW OPTIMIZED VERSION)
 */
export async function fetchVersesBatch(
  surahNumber: number,
  start: number = 1,
  end: number = 20,
  includeTranslations: boolean = true,
  includeTransliterations: boolean = true
): Promise<{
  verses: VerseData[];
  pagination: {
    start: number;
    end: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const cacheKey = `verses-batch-${surahNumber}-${start}-${end}-${includeTranslations}-${includeTransliterations}`;
  const cached = getCachedData<{ verses: VerseData[]; pagination: { start: number; end: number; total: number; hasMore: boolean } }>(cacheKey);
  if (cached) return cached;

  try {
    const includes = [];
    if (includeTranslations) includes.push('translation');
    if (includeTransliterations) includes.push('transliteration');

    const response = await fetch(
      `${API_BASE}/api/v1/get-verses-batch?surah=${surahNumber}&start=${start}&end=${end}&include=${includes.join(',')}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch verses batch: ${response.status}`);
    }

    const data: BatchApiResponse = await response.json();
    
    if (!data.success || !Array.isArray(data.data.verses)) {
      throw new Error('Invalid batch response structure');
    }

    const result = {
      verses: data.data.verses.map((v) => ({
        id: v.id,
        surahId: v.surahId,
        numberInSurah: v.numberInSurah,
        text: v.text,
        translation: v.translation,
        transliteration: v.transliteration?.clean,
        text_uthmani: v.text, // Assuming text_uthmani is the same as text for now, or needs to be fetched
      })),
      pagination: data.data.pagination
    };

    setCachedData(cacheKey, result);
    return result;

  } catch (error) {
    console.error('Error fetching verses batch:', error);
    throw error;
  }
}

/**
 * Fetch multiple verses with translations for a surah (LEGACY - kept for compatibility)
 */
export async function fetchVersesWithTranslations(
  surahNumber: number,
  startVerse?: number,
  endVerse?: number,
  translator: string = 'en.yusufali',
  includeTransliterations: boolean = true
): Promise<VerseData[]> {
  try {
    // Fetch verses from our API
    const versesResponse = await fetch(`${API_BASE}/api/v1/get-verses?surah=${surahNumber}`);

    if (!versesResponse.ok) {
      throw new Error(`Failed to fetch verses: ${versesResponse.status}`);
    }

    const verses = await versesResponse.json();

    if (!Array.isArray(verses)) {
      throw new Error('Invalid verses data structure');
    }

    // Fetch transliterations for the entire surah if requested
    const transliterationMap: Map<number, string> = new Map();
    if (includeTransliterations) {
      try {
        const transliterationResponse = await fetchTransliterations(surahNumber, undefined, 'clean');
        if (transliterationResponse.success && transliterationResponse.data.verses) {
          transliterationResponse.data.verses.forEach(verse => {
            if (verse.transliteration.clean) {
              transliterationMap.set(verse.ayahId, verse.transliteration.clean);
            }
          });
        }
      } catch (error) {
        console.warn('Failed to fetch transliteration:', error);
        // Continue without transliteration
      }
    }

    // Fetch translations for all verses in the surah
    const translationMap: Map<number, string> = new Map();
    try {
      for (const verse of verses) {
        try {
          const translationResponse = await fetch(`${API_BASE}/api/v1/get-translated-verse?surah=${surahNumber}&ayah=${verse.numberInSurah}&translator=${translator}`);
          if (translationResponse.ok) {
            const translationData = await translationResponse.json();
            if (translationData.translation) {
              translationMap.set(verse.numberInSurah, translationData.translation);
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch translation for verse ${verse.numberInSurah}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch translations:', error);
    }

    // Map to VerseData interface
    const versesData: VerseData[] = verses.map((v: ApiVerseResponse) => ({
      id: v.id,
      surahId: v.surahId,
      numberInSurah: v.numberInSurah,
      text: v.text,
      translation: translationMap.get(v.numberInSurah) || 'Translation not available',
      transliteration: transliterationMap.get(v.numberInSurah),
      juz: v.juz,
      hizbQuarter: v.hizbQuarter,
      sajda: v.sajda,
      text_uthmani: v.text, // Assuming text_uthmani is the same as text for now, or needs to be fetched
    }));

    // Filter by start and end verse if specified
    const start = startVerse || 1;
    const end = endVerse || versesData.length;

    return versesData.filter(v => v.numberInSurah >= start && v.numberInSurah <= end);

  } catch (error) {
    console.error('Error fetching verses with translations:', error);
    throw error;
  }
}

/**
 * Fetch surah description from our API
 */
export async function fetchSurahDescription(surahNumber: number): Promise<SurahDescription> {
  const cacheKey = `surah-description-${surahNumber}`;
  const cached = getCachedData<SurahDescription>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/api/v1/get-surah-description?surahId=${surahNumber}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch surah description: ${response.status}`);
    }
    
    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
    
  } catch (error) {
    console.error('Error fetching surah description:', error);
    throw error;
  }
}

/**
 * Get a random verse for "Verse of the Day"
 */
export async function getVerseOfTheDay(): Promise<VerseData> {
  // Use a deterministic approach based on the current date
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Popular verses for rotation
  const popularVerses = [
    { surah: 1, verse: 1 }, // Al-Fatiha opening
    { surah: 2, verse: 255 }, // Ayat al-Kursi
    { surah: 112, verse: 1 }, // Al-Ikhlas
    { surah: 113, verse: 1 }, // Al-Falaq
    { surah: 114, verse: 1 }, // An-Nas
    { surah: 55, verse: 13 }, // Ar-Rahman
    { surah: 67, verse: 2 }, // Al-Mulk
    { surah: 36, verse: 1 }, // Ya-Sin
    { surah: 18, verse: 1 }, // Al-Kahf
    { surah: 3, verse: 26 }, // Ali 'Imran
  ];
  
  const selectedVerse = popularVerses[dayOfYear % popularVerses.length];
  
  try {
    return await fetchVerseWithTranslation(selectedVerse.surah, selectedVerse.verse);
  } catch (error) {
    console.error('Error fetching verse of the day:', error);
    // Fallback to Al-Fatiha 1:1
    return await fetchVerseWithTranslation(1, 1);
  }
}

/**
 * Search for verses containing specific text (basic implementation)
 */
export async function searchVerses(query: string, surahNumber?: number): Promise<VerseData[]> {
  // This is a basic implementation - in a real app you'd want a proper search API
  try {
    if (surahNumber) {
      const verses = await fetchVersesWithTranslations(surahNumber);
      return verses.filter(verse => 
        verse.text.includes(query) || 
        (verse.translation && verse.translation.toLowerCase().includes(query.toLowerCase())) ||
        (verse.transliteration && verse.transliteration.toLowerCase().includes(query.toLowerCase()))
      );
    } else {
      // For now, just search in popular surahs
      const searchPromises = [1, 2, 3, 18, 36, 55, 67, 112, 113, 114].map(async (surah) => {
        try {
          const verses = await fetchVersesWithTranslations(surah);
          return verses.filter(verse => 
            verse.text.includes(query) || 
            (verse.translation && verse.translation.toLowerCase().includes(query.toLowerCase())) ||
            (verse.transliteration && verse.transliteration.toLowerCase().includes(query.toLowerCase()))
          );
        } catch {
          return [];
        }
      });
      
      const results = await Promise.all(searchPromises);
      return results.flat(); // Flatten the array of arrays
    }
  } catch (error) {
    console.error('Error searching verses:', error);
    return []; // Return empty array on error
  }
}

/**
 * Get surah name by number
 */
export async function getSurahName(surahNumber: number): Promise<string> {
  try {
    const surahs = await fetchSurahs();
    const surah = surahs.find(s => s.number === surahNumber);
    return surah ? surah.ename : `Surah ${surahNumber}`;
  } catch (error) {
    console.error('Error getting surah name:', error);
    return `Surah ${surahNumber}`;
  }
}

/**
 * Validate surah and verse numbers
 */
export function validateSurahVerse(surahNumber: number, verseNumber?: number): boolean {
  if (surahNumber < 1 || surahNumber > 114) {
    return false;
  }
  
  if (verseNumber !== undefined) {
    // Basic validation - in a real app you'd check against actual verse counts
    return verseNumber >= 1 && verseNumber <= 286; // Max verses in any surah
  }
  
  return true;
}

/**
 * Format verse reference
 */
export function formatVerseReference(surahNumber: number, verseNumber: number, surahName?: string): string {
  if (surahName) {
    return `${surahName} ${surahNumber}:${verseNumber}`;
  }
  return `${surahNumber}:${verseNumber}`;
}

/**
 * Clear API cache (useful for testing or when data updates)
 */
export function clearApiCache(): void {
  cache.clear();
}