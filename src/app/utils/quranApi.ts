// Quran API utilities for fetching verses, surahs, and translations
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

const API_BASE = 'https://luminous-verses-api-tan.vercel.app/api/v1';

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
 * Fetch all surahs metadata
 */
export async function fetchSurahs(): Promise<SurahMetadata[]> {
  const cacheKey = 'surahs-metadata';
  const cached = getCachedData<SurahMetadata[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/get-metadata?type=surah-list`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch surahs: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle different possible response structures
    const surahsData = Array.isArray(data) ? data : data.defaultData?.surahs || data.surahs || data.chapters || [];
    
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
 * Fetch verses for a specific surah (Arabic only)
 */
export async function fetchVerses(surahNumber: number): Promise<VerseData[]> {
  const cacheKey = `verses-${surahNumber}`;
  const cached = getCachedData<VerseData[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/get-verses?surah=${surahNumber}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verses: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid verses data structure');
    }

    setCachedData(cacheKey, data);
    return data;
    
  } catch (error) {
    console.error('Error fetching verses:', error);
    throw error;
  }
}

/**
 * Fetch a single verse with translation
 */
export async function fetchVerseWithTranslation(
  surahNumber: number, 
  verseNumber: number,
  translator: string = 'en.yusufali'
): Promise<VerseData> {
  const cacheKey = `verse-${surahNumber}-${verseNumber}-${translator}`;
  const cached = getCachedData<VerseData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${API_BASE}/get-translated-verse?surah=${surahNumber}&ayah=${verseNumber}&translator=${translator}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verse translation: ${response.status}`);
    }
    
    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
    
  } catch (error) {
    console.error('Error fetching verse translation:', error);
    throw error;
  }
}

/**
 * Fetch multiple verses with translations for a surah
 */
export async function fetchVersesWithTranslations(
  surahNumber: number,
  startVerse?: number,
  endVerse?: number,
  translator: string = 'en.yusufali'
): Promise<VerseData[]> {
  try {
    // First get the basic verses to know how many there are
    const verses = await fetchVerses(surahNumber);
    
    const start = startVerse || 1;
    const end = endVerse || verses.length;
    
    // Fetch translations for the requested range
    const translationPromises = [];
    for (let i = start; i <= end; i++) {
      translationPromises.push(fetchVerseWithTranslation(surahNumber, i, translator));
    }
    
    const translatedVerses = await Promise.all(translationPromises);
    return translatedVerses;
    
  } catch (error) {
    console.error('Error fetching verses with translations:', error);
    throw error;
  }
}

/**
 * Fetch surah description
 */
export async function fetchSurahDescription(surahNumber: number): Promise<SurahDescription> {
  const cacheKey = `surah-description-${surahNumber}`;
  const cached = getCachedData<SurahDescription>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/get-surah-description?surahId=${surahNumber}`);
    
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
        (verse.translation && verse.translation.toLowerCase().includes(query.toLowerCase()))
      );
    } else {
      // For now, just search in popular surahs
      const searchPromises = [1, 2, 3, 18, 36, 55, 67, 112, 113, 114].map(async (surah) => {
        try {
          const verses = await fetchVersesWithTranslations(surah);
          return verses.filter(verse => 
            verse.text.includes(query) || 
            (verse.translation && verse.translation.toLowerCase().includes(query.toLowerCase()))
          );
        } catch {
          return [];
        }
      });
      
      const results = await Promise.all(searchPromises);
      return results.flat();
    }
  } catch (error) {
    console.error('Error searching verses:', error);
    return [];
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