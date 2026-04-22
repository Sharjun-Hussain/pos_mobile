import useSWR from 'swr';
import { api } from '@/services/api';

/**
 * Custom hook for data fetching using SWR and the internal API service.
 * 
 * @param {string|null} endpoint - The API endpoint to fetch data from.
 * @param {object} options - SWR configuration options.
 * @returns {object} - { data, error, isLoading, isValidating, mutate }
 */
export function useFetch(endpoint, options = {}) {
  const fetcher = (url) => api.get(url);

  const { data, error, isValidating, mutate } = useSWR(
    endpoint,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 5000, // Dedup identical requests within 5 seconds
      ...options
    }
  );

  return {
    data: data?.data || data, // Handle both { status, data, message } and direct responses
    fullResponse: data,
    error,
    isLoading: !error && !data,
    isValidating,
    mutate
  };
}
