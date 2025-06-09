'use client';

import { useState, useEffect } from 'react';

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

// Fallback descriptions for offline/API failure scenarios
const fallbackDescriptions: Record<number, SurahDescriptionData> = {
  1: {
    number: 1,
    name: 'الفاتحة',
    ename: 'Al-Fatiha',
    tname: 'The Opening',
    type: 'Meccan',
    ayas: 7,
    description: 'Al-Fatiha is the opening chapter of the Quran, often called "The Mother of the Book." It serves as a beautiful introduction to the entire Quran, containing praise for Allah, a request for guidance, and a prayer for the straight path. This chapter is recited in every unit of the daily prayers.',
    revelation: {
      period: 'Early Meccan Period',
      circumstances: 'Revealed as the opening prayer and summary of the entire Quran'
    },
    themes: ['Praise of Allah', 'Seeking Guidance', 'The Straight Path', 'Divine Mercy'],
    keyVerses: [1, 2, 6, 7],
    historicalContext: 'This was among the first complete chapters revealed to Prophet Muhammad (peace be upon him) in Mecca.'
  },
  2: {
    number: 2,
    name: 'البقرة',
    ename: 'Al-Baqarah',
    tname: 'The Cow',
    type: 'Medinan',
    ayas: 286,
    description: 'Al-Baqarah is the longest chapter in the Quran, containing guidance for the early Muslim community in Medina. It covers many important topics including stories of previous prophets, laws for the community, and the famous story of the cow that gives the chapter its name.',
    revelation: {
      period: 'Medinan Period',
      circumstances: 'Revealed over several years to guide the growing Muslim community'
    },
    themes: ['Community Laws', 'Stories of Prophets', 'Faith and Belief', 'Social Justice'],
    keyVerses: [255, 282, 286],
    historicalContext: 'Revealed in Medina when the Muslim community was establishing its social and legal framework.'
  },
  112: {
    number: 112,
    name: 'الإخلاص',
    ename: 'Al-Ikhlas',
    tname: 'The Sincerity',
    type: 'Meccan',
    ayas: 4,
    description: 'Al-Ikhlas is a short but powerful chapter that describes the absolute oneness and uniqueness of Allah. Despite being only four verses, it is said to be equivalent to one-third of the Quran in its meaning and importance.',
    revelation: {
      period: 'Meccan Period',
      circumstances: 'Revealed in response to questions about the nature of Allah'
    },
    themes: ['Unity of Allah', 'Divine Attributes', 'Pure Monotheism'],
    keyVerses: [1, 2, 3, 4],
    historicalContext: 'This chapter was revealed when people asked Prophet Muhammad about the nature and attributes of Allah.'
  }
};

interface UseSurahDescriptionReturn {
  data: SurahDescriptionData | null;
  loading: boolean;
  error: string | null;
}

const useSurahDescription = (surahNumber: number | null): UseSurahDescriptionReturn => {
  const [data, setData] = useState<SurahDescriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!surahNumber) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchSurahDescription = async () => {
      setLoading(true);
      setError(null);

      try {
        // First, try to fetch from API
        const response = await fetch(`https://luminous-verses-api-tan.vercel.app/api/v1/get-surah-description?surahId=${surahNumber}`);
        
        if (response.ok) {
          const apiData = await response.json();
          console.log('Surah description API response:', apiData);
          
          // Check if API response is successful and has surah data
          if (apiData.success && apiData.surah) {
            const surahData = apiData.surah;
            
            // Map API response to our interface using the correct structure
            const mappedData: SurahDescriptionData = {
              number: surahNumber,
              name: surahData.name?.arabic || `Surah ${surahNumber}`,
              ename: surahData.name?.english || `Surah ${surahNumber}`,
              tname: surahData.name?.transliteration || `Chapter ${surahNumber}`,
              type: (surahData.metadata?.revelationType as 'Meccan' | 'Medinan') || (surahNumber <= 86 ? 'Meccan' : 'Medinan'),
              ayas: surahData.metadata?.totalVerses || 0,
              description: surahData.description || `This is Chapter ${surahNumber} of the Holy Quran.`,
              revelation: {
                period: surahData.metadata?.revelationType === 'Meccan' ? 'Meccan Period' : 'Medinan Period',
                circumstances: `Revealed during the ${surahData.metadata?.revelationType || 'early'} period. Chronological order: ${surahData.metadata?.chronologicalOrder || 'unknown'}.`
              },
              themes: ['Divine Guidance', 'Spiritual Wisdom', 'Moral Teachings'], // API doesn't provide themes yet
              keyVerses: [], // API doesn't provide key verses yet
              historicalContext: `This chapter was the ${surahData.metadata?.chronologicalOrder || 'unknown'} chapter revealed chronologically during the ${surahData.metadata?.revelationType || 'early'} period.`
            };
            
            setData(mappedData);
            setLoading(false);
            return;
          }
        }
        
        // If API fails, try fallback data
        const fallbackData = fallbackDescriptions[surahNumber];
        if (fallbackData) {
          console.log('Using fallback data for surah', surahNumber);
          setData(fallbackData);
          setLoading(false);
          return;
        }

        // If no fallback data, create basic description
        const basicDescription: SurahDescriptionData = {
          number: surahNumber,
          name: `Surah ${surahNumber}`,
          ename: `Surah ${surahNumber}`,
          tname: `Chapter ${surahNumber}`,
          type: surahNumber <= 86 ? 'Meccan' : 'Medinan', // Rough approximation
          ayas: 0,
          description: `This is Chapter ${surahNumber} of the Holy Quran. Each chapter contains beautiful verses with guidance and wisdom for all of humanity.`,
          revelation: {
            period: surahNumber <= 86 ? 'Meccan Period' : 'Medinan Period',
            circumstances: 'Part of the divine revelation to Prophet Muhammad (peace be upon him)'
          },
          themes: ['Divine Guidance', 'Spiritual Wisdom', 'Moral Teachings'],
          keyVerses: [],
          historicalContext: 'Revealed as part of the complete guidance in the Holy Quran.'
        };

        setData(basicDescription);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching surah description:', err);
        
        // Try fallback data on error
        const fallbackData = fallbackDescriptions[surahNumber];
        if (fallbackData) {
          console.log('Using fallback data due to API error for surah', surahNumber);
          setData(fallbackData);
          setLoading(false);
          return;
        }
        
        setError('Unable to load surah description. Please try again.');
        setLoading(false);
      }
    };

    fetchSurahDescription();
  }, [surahNumber]);

  return { data, loading, error };
};

export default useSurahDescription;