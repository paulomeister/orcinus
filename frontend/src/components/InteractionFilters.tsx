import { useState } from 'react';
import type { Agent, InteractionFilters as Filters } from '../api/types';

interface InteractionFiltersProps {
  agents: Agent[];
  initial: Filters;
  onApply: (filters: Filters) => void;
}

export function InteractionFilters({ agents, initial, onApply }: InteractionFiltersProps) {
  const [draft, setDraft] = useState<Filters>(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft);
      }}
      className="flex flex-wrap items-end gap-3 rounded bg-muted p-4"
    >
      <label className="flex flex-col text-sm">
        Agente
        <select
          value={draft.agentId ?? ''}
          onChange={(e) => setDraft({ ...draft, agentId: e.target.value || undefined })}
          className="rounded border border-gray-300 px-2 py-1"
        >
          <option value="">Todos</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm">
        Estado
        <select
          value={draft.status ?? ''}
          onChange={(e) =>
            setDraft({ ...draft, status: (e.target.value || undefined) as Filters['status'] })
          }
          className="rounded border border-gray-300 px-2 py-1"
        >
          <option value="">Todos</option>
          <option value="abierta">Abierta</option>
          <option value="en_progreso">En progreso</option>
          <option value="resuelta">Resuelta</option>
        </select>
      </label>

      <label className="flex flex-col text-sm">
        Tipo
        <select
          value={draft.type ?? ''}
          onChange={(e) =>
            setDraft({ ...draft, type: (e.target.value || undefined) as Filters['type'] })
          }
          className="rounded border border-gray-300 px-2 py-1"
        >
          <option value="">Todos</option>
          <option value="llamada">Llamada</option>
          <option value="ticket">Ticket</option>
        </select>
      </label>

      <label className="flex flex-col text-sm">
        Desde
        <input
          type="date"
          value={draft.startDate ?? ''}
          onChange={(e) => setDraft({ ...draft, startDate: e.target.value || undefined })}
          className="rounded border border-gray-300 px-2 py-1"
        />
      </label>

      <label className="flex flex-col text-sm">
        Hasta
        <input
          type="date"
          value={draft.endDate ?? ''}
          onChange={(e) => setDraft({ ...draft, endDate: e.target.value || undefined })}
          className="rounded border border-gray-300 px-2 py-1"
        />
      </label>

      <button type="submit" className="rounded bg-ink px-4 py-1.5 text-sm text-white">
        Aplicar
      </button>
    </form>
  );
}
