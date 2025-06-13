'use client';

import { useEffect } from 'react';
import useApi from './useApi'; // Import the new useApi hook

// Types for surah description data
export interface SurahDescriptionData {
  number: number;
  name: string;
  ename: string;
  tname: string;
  type: 'Meccan' | 'Medinan';
  ayas: number;
  description: string;
  revelation: {
    period: string;
    circumstances: string;
  };
  themes: string[];
  keyVerses: number[];
  historicalContext?: string;
}

interface SurahApiResponse {
  success: boolean;
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
      lastUpdated: string;
    };
  };
}

interface UseSurahDescriptionReturn {
  data: SurahDescriptionData | null;
  loading: boolean;
  error: string | null;
}

const useSurahDescription = (surahNumber: number | null): UseSurahDescriptionReturn => {
  const API_BASE = 'https://luminous-verses-api-tan.vercel.app';
  const { data: apiData, loading, error, fetchData } = useApi<SurahApiResponse>( // Specify a more precise type
    `${API_BASE}/api/v1/get-surah-description`,
    null,
    false // Don't fetch on mount, we'll trigger it manually
  );

  useEffect(() => {
    if (surahNumber) {
      fetchData({ surahId: surahNumber });
    }
  }, [surahNumber, fetchData]);

  // Map API response to our interface
  const mappedData: SurahDescriptionData | null = apiData?.success && apiData?.surah
    ? {
        number: surahNumber!,
        name: apiData.surah.name?.arabic || `Surah ${surahNumber}`,
        ename: apiData.surah.name?.english || `Surah ${surahNumber}`,
        tname: apiData.surah.name?.transliteration || `Chapter ${surahNumber}`,
        type: (apiData.surah.metadata?.revelationType as 'Meccan' | 'Medinan') || (surahNumber! <= 86 ? 'Meccan' : 'Medinan'),
        ayas: apiData.surah.metadata?.totalVerses || 0,
        description: apiData.surah.description || `This is Chapter ${surahNumber} of the Holy Quran.`,
        revelation: {
          period: apiData.surah.metadata?.revelationType === 'Meccan' ? 'Meccan Period' : 'Medinan Period',
          circumstances: `Revealed during the ${apiData.surah.metadata?.revelationType || 'early'} period. Chronological order: ${apiData.surah.metadata?.chronologicalOrder || 'unknown'}.`
        },
        themes: ['Divine Guidance', 'Spiritual Wisdom', 'Moral Teachings'], // API doesn't provide themes yet
        keyVerses: [], // API doesn't provide key verses yet
        historicalContext: `This chapter was the ${apiData.surah.metadata?.chronologicalOrder || 'unknown'} chapter revealed chronologically during the ${apiData.surah.metadata?.revelationType || 'early'} period.`
      }
    : null;

  return { data: mappedData, loading, error };
};

export default useSurahDescription;