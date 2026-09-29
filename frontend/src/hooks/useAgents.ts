import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { Agent } from '../api/types';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Agent[]>('/agents')
      .then((result) => {
        if (!cancelled) setAgents(result);
      })
      .catch(() => {
        // Non-critical: filter dropdown just stays empty on failure.
        if (!cancelled) setAgents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { agents, loading };
}
