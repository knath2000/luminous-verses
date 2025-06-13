import { useState, useEffect, useCallback } from 'react';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetchData: (params?: Record<string, string | number | boolean>) => Promise<void>;
}

const useApi = <T>(
  url: string,
  initialData: T | null = null,
  fetchOnMount: boolean = true
): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (params?: Record<string, string | number | boolean>) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams(params as Record<string, string>).toString();
      const response = await fetch(`${url}${queryParams ? `?${queryParams}` : ''}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setData(null); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchData, fetchOnMount]);

  return { data, loading, error, fetchData };
};

export default useApi;