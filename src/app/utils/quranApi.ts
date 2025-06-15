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

const API_BASE = 'https://luminous-verses-api-tan.vercel.app/api/v1'; // Our own Neon database API

/**
 * Fetch transliterations for a specific verse or surah
 */
export async function fetchTransliterations(
  surahNumber: number,
  verseNumber?: number,
  format: 'raw' | 'clean' | 'formatted' | 'all' = 'all'
): Promise<TransliterationResponse> {
  try {
    const params = new URLSearchParams({
      surah: surahNumber.toString(),
      format
    });
    
    if (verseNumber) {
      params.append('ayah', verseNumber.toString());
    }

    const response = await fetch(`${API_BASE}/get-transliterations?${params}`, {
      cache: 'force-cache',
      next: { revalidate: 300 } // 5-minute revalidation
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transliterations: ${response.status}`);
    }
    
    const data = await response.json();
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
  try {
    const response = await fetch(`${API_BASE}/get-metadata?type=surah-list`, {
      cache: 'force-cache',
      next: { revalidate: 86400 } // 24-hour cache for static data
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch surahs: ${response.status}`);
    }
    
    const surahsData = await response.json();
    
    if (!Array.isArray(surahsData)) {
      throw new Error('Invalid surahs data structure');
    }

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
  try {
    const response = await fetch(`${API_BASE}/get-verses?surah=${surahNumber}`, {
      cache: 'force-cache',
      next: { revalidate: 300 } // 5-minute revalidation
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verses: ${response.status}`);
    }
    
    const versesData = await response.json();
    
    if (!Array.isArray(versesData)) {
      throw new Error('Invalid verses data structure');
    }

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
  try {
    // Fetch Arabic text from our API
    const arabicResponse = await fetch(`${API_BASE}/get-verses?surah=${surahNumber}`, {
      cache: 'force-cache',
      next: { revalidate: 300 } // 5-minute revalidation
    });
    if (!arabicResponse.ok) {
      throw new Error(`Failed to fetch arabic verses: ${arabicResponse.status}`);
    }
    const arabicVerses = await arabicResponse.json();
    const arabicVerse = arabicVerses.find((v: ApiVerseResponse) => v.numberInSurah === verseNumber);
    
    if (!arabicVerse) {
      throw new Error(`Verse ${surahNumber}:${verseNumber} not found`);
    }

    // Fetch translation from our API
    const translationResponse = await fetch(`${API_BASE}/get-translated-verse?surah=${surahNumber}&ayah=${verseNumber}&translator=${translator}`, {
      cache: 'force-cache',
      next: { revalidate: 300 } // 5-minute revalidation
    });
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
  try {
    const includes = [];
    if (includeTranslations) includes.push('translation');
    if (includeTransliterations) includes.push('transliteration');

    const response = await fetch(
      `${API_BASE}/get-verses-batch?surah=${surahNumber}&start=${start}&end=${end}&include=${includes.join(',')}`, {
        cache: 'force-cache',
        next: { revalidate: 300 } // 5-minute revalidation
      }
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
    const versesResponse = await fetch(`${API_BASE}/get-verses?surah=${surahNumber}`, {
      cache: 'force-cache',
      next: { revalidate: 300 } // 5-minute revalidation
    });

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
          const translationResponse = await fetch(`${API_BASE}/get-translated-verse?surah=${surahNumber}&ayah=${verse.numberInSurah}&translator=${translator}`, {
            cache: 'force-cache',
            next: { revalidate: 300 } // 5-minute revalidation
          });
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
  try {
    const response = await fetch(`${API_BASE}/get-surah-description?surahId=${surahNumber}`, {
      cache: 'force-cache',
      next: { revalidate: 300 } // 5-minute revalidation
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch surah description: ${response.status}`);
    }
    
    const data = await response.json();
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

  return fetchVerseWithTranslation(selectedVerse.surah, selectedVerse.verse);
}

/**
 * Search verses by query
 */
export async function searchVerses(query: string, surahNumber?: number): Promise<VerseData[]> {
  try {
    let url = `${API_BASE}/search-verses?query=${encodeURIComponent(query)}`;
    if (surahNumber) {
      url += `&surah=${surahNumber}`;
    }

    const response = await fetch(url, {
      cache: 'no-store' // Search results should not be cached
    });

    if (!response.ok) {
      throw new Error(`Failed to search verses: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid search results structure');
    }
    return data.data;
  } catch (error) {
    console.error('Error searching verses:', error);
    throw error;
  }
}

/**
 * Get surah name by number
 */
export async function getSurahName(surahNumber: number): Promise<string> {
  const surahs = await fetchSurahs();
  const surah = surahs.find(s => s.number === surahNumber);
  return surah ? surah.ename : `Surah ${surahNumber}`;
}

/**
 * Validate surah and verse numbers
 */
export function validateSurahVerse(surahNumber: number, verseNumber?: number): boolean {
  // Basic validation, can be expanded with actual surah/verse counts
  if (surahNumber < 1 || surahNumber > 114) return false;
  if (verseNumber && (verseNumber < 1 || verseNumber > 286)) return false; // Max verses in Al-Baqarah
  return true;
}

/**
 * Format verse reference string
 */
export function formatVerseReference(surahNumber: number, verseNumber: number, surahName?: string): string {
  if (surahName) {
    return `${surahName} (${surahNumber}):${verseNumber}`;
  }
  return `Surah ${surahNumber}:${verseNumber}`;
}