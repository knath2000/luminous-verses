import { useState, useCallback } from 'react';
import { getSurahName } from '../utils/quranApi';

export function useSurahNames() {
  const [surahNames, setSurahNames] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSurahName = useCallback(async (surahId: number) => {
    if (surahNames.has(surahId)) {
      return surahNames.get(surahId);
    }

    setLoading(true);
    setError(null);
    try {
      const name = await getSurahName(surahId);
      setSurahNames(prev => new Map(prev).set(surahId, name));
      return name;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch surah name');
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [surahNames]);

  // Optionally pre-fetch all surah names if needed globally
  // useEffect(() => {
  //   const loadAllSurahNames = async () => {
  //     setLoading(true);
  //     setError(null);
  //     try {
  //       const allSurahs = await fetchSurahs(); // Assuming fetchSurahs exists and returns all surah metadata
  //       const newMap = new Map<number, string>();
  //       allSurahs.forEach(surah => newMap.set(surah.number, surah.ename)); // Using ename as the name
  //       setSurahNames(newMap);
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : 'Failed to load all surah names');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadAllSurahNames();
  // }, []);

  return { surahNames, fetchSurahName, loading, error };
}