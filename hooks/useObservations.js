import { useState, useCallback } from 'react';
import { getObservations } from '../db/database';

const LIMIT = 20;

export function useObservations() {
  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchObservations = useCallback(async (currentOffset, isRefresh = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // getObservations is synchronous, but we can wrap it or just run it synchronously.
      // Doing it in a setTimeout allows UI thread to breathe or we can run directly.
      const newItems = getObservations(LIMIT, currentOffset);
      
      if (isRefresh) {
        setObservations(newItems);
        setOffset(newItems.length);
        setHasMore(newItems.length === LIMIT);
      } else {
        if (newItems.length > 0) {
          setObservations((prev) => {
            // Deduplicate items just in case
            const existingIds = new Set(prev.map(item => item.id));
            const filtered = newItems.filter(item => !existingIds.has(item.id));
            return [...prev, ...filtered];
          });
          setOffset(currentOffset + newItems.length);
          setHasMore(newItems.length === LIMIT);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error fetching observations in hook:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    fetchObservations(offset, false);
  }, [isLoading, hasMore, offset, fetchObservations]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchObservations(0, true);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchObservations]);

  return {
    observations,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  };
}
