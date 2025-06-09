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

const API_BASE = process.env.NEXT_PUBLIC_QURAN_API_URL || 'https://api.quran.com/api/v4'; // Use env var or fallback

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
    const response = await fetch(`${API_BASE}/chapters`); // Updated endpoint based on standard Quran.com API
    
    if (!response.ok) {
      throw new Error(`Failed to fetch surahs: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle different possible response structures
    const surahsData = Array.isArray(data) ? data : data.chapters || []; // Use data.chapters for standard API
    
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
    const response = await fetch(`${API_BASE}/verses/by_chapter/${surahNumber}`); // Updated endpoint
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verses: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data.verses)) { // Standard API returns data.verses
      throw new Error('Invalid verses data structure');
    }

    // Map standard API response to VerseData interface
    const versesData: VerseData[] = data.verses.map((v: any) => ({
      id: v.id,
      surahId: v.chapter_id,
      numberInSurah: v.verse_number,
      text: v.text_uthmani, // Use Uthmani text
      juz: v.juz_number,
      hizbQuarter: v.hizb_number,
      sajda: v.sajdah_type !== null,
    }));

    setCachedData(cacheKey, versesData);
    return versesData;
    
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
    // Fetch Arabic text
    const arabicVerseResponse = await fetch(`${API_BASE}/verses/by_key/${surahNumber}:${verseNumber}`);
    if (!arabicVerseResponse.ok) {
       throw new Error(`Failed to fetch arabic verse: ${arabicVerseResponse.status}`);
    }
    const arabicVerseData = await arabicVerseResponse.json();
    const arabicVerse = arabicVerseData.verse;

    // Fetch translation
    const translationResponse = await fetch(
      `${API_BASE}/verses/by_key/${surahNumber}:${verseNumber}?translations=${translator}`
    );
    
    if (!translationResponse.ok) {
      throw new Error(`Failed to fetch verse translation: ${translationResponse.status}`);
    }
    
    const translationData = await translationResponse.json();
    const translationVerse = translationData.verse;

    const verseData: VerseData = {
      id: arabicVerse.id,
      surahId: arabicVerse.chapter_id,
      numberInSurah: arabicVerse.verse_number,
      text: arabicVerse.text_uthmani,
      translation: translationVerse.translations?.[0]?.text || 'Translation not available',
      transliteration: translationVerse.text_imlaei_simple || undefined, // Use simple transliteration if available
      juz: arabicVerse.juz_number,
      hizbQuarter: arabicVerse.hizb_number,
      sajda: arabicVerse.sajdah_type !== null,
    };

    setCachedData(cacheKey, verseData);
    return verseData;
    
  } catch (error) {
    console.error('Error fetching verse with translation:', error);
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
    // Fetch verses with translation for the requested range
    const response = await fetch(
      `${API_BASE}/verses/by_chapter/${surahNumber}?translations=${translator}&per_page=286` // Fetch all verses for the surah
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch verses with translations: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.verses)) {
      throw new Error('Invalid verses data structure');
    }

    // Map standard API response to VerseData interface
    const versesData: VerseData[] = data.verses.map((v: any) => ({
      id: v.id,
      surahId: v.chapter_id,
      numberInSurah: v.verse_number,
      text: v.text_uthmani,
      translation: v.translations?.[0]?.text || 'Translation not available',
      transliteration: v.text_imlaei_simple || undefined,
      juz: v.juz_number,
      hizbQuarter: v.hizb_number,
      sajda: v.sajdah_type !== null,
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
 * Fetch surah description
 */
export async function fetchSurahDescription(surahNumber: number): Promise<SurahDescription> {
  const cacheKey = `surah-description-${surahNumber}`;
  const cached = getCachedData<SurahDescription>(cacheKey);
  if (cached) return cached;

  try {
    // Assuming the luminous-verses-api is still needed for descriptions
    const response = await fetch(`https://luminous-verses-api-tan.vercel.app/api/v1/get-surah-description?surahId=${surahNumber}`);
    
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