import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { InteractionFilters, PaginatedInteractions } from '../api/types';

export interface Pagination {
  page: number;
  pageSize: number;
}

export function useInteractions(filters: InteractionFilters, pagination: Pagination) {
  const [data, setData] = useState<PaginatedInteractions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<PaginatedInteractions>('/interactions', {
      agentId: filters.agentId,
      status: filters.status,
      type: filters.type,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
    })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    filters.agentId,
    filters.status,
    filters.type,
    filters.startDate,
    filters.endDate,
    pagination.page,
    pagination.pageSize,
    reloadToken,
  ]);

  return { data, loading, error, refetch };
}
