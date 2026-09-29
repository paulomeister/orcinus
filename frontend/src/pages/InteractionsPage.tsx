import { useState } from 'react';
import { InteractionFilters } from '../components/InteractionFilters';
import { InteractionTable } from '../components/InteractionTable';
import { Pagination } from '../components/Pagination';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAgents } from '../hooks/useAgents';
import { useInteractions } from '../hooks/useInteractions';
import type { InteractionFilters as Filters } from '../api/types';

const PAGE_SIZE = 10;

export function InteractionsPage() {
  const { agents } = useAgents();
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);

  const { data, loading, error } = useInteractions(filters, { page, pageSize: PAGE_SIZE });

  function applyFilters(next: Filters) {
    setFilters(next);
    setPage(1); // reset to first page whenever filters change
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Interacciones</h1>

      <InteractionFilters agents={agents} initial={filters} onApply={applyFilters} />

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && data && (
        <>
          <div className="overflow-x-auto rounded border border-gray-200">
            <InteractionTable rows={data.data} />
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
