import { useState } from 'react';
import { InteractionFilters } from '../components/InteractionFilters';
import { InteractionTable } from '../components/InteractionTable';
import { CreateInteractionForm } from '../components/CreateInteractionForm';
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
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, loading, error, refetch } = useInteractions(filters, { page, pageSize: PAGE_SIZE });

  function applyFilters(next: Filters) {
    setFilters(next);
    setPage(1); // reset to first page whenever filters change
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Interacciones</h1>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="rounded bg-ink px-4 py-1.5 text-sm text-white"
        >
          Nueva interacción
        </button>
      </div>

      <InteractionFilters agents={agents} initial={filters} onApply={applyFilters} />

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && data && (
        <>
          <div className="overflow-x-auto rounded border border-gray-200">
            <InteractionTable rows={data.data} onStatusChanged={refetch} />
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}

      {showCreateForm && (
        <CreateInteractionForm
          agents={agents}
          onCreated={refetch}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
