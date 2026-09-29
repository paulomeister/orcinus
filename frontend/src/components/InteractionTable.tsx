import { useState } from 'react';
import type { Interaction, InteractionStatus } from '../api/types';
import { apiPatch } from '../api/client';
import { formatDateTime } from '../utils/format';
import { StatusBadge } from './StatusBadge';

// Mirrors src/services/interaction.service.ts ALLOWED_TRANSITIONS.
// This is UX-only: the server remains the source of truth and is
// re-validated on every PATCH regardless of what this map allows.
const NEXT_STATUS: Record<InteractionStatus, InteractionStatus | null> = {
  abierta: 'en_progreso',
  en_progreso: 'resuelta',
  resuelta: null,
};

const NEXT_LABEL: Record<InteractionStatus, string> = {
  abierta: 'Iniciar',
  en_progreso: 'Resolver',
  resuelta: '',
};

export function InteractionTable({ rows, onStatusChanged }: { rows: Interaction[]; onStatusChanged: () => void }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  async function advanceStatus(interaction: Interaction) {
    const next = NEXT_STATUS[interaction.status];
    if (!next) return;

    setPendingId(interaction.id);
    setRowError(null);
    try {
      await apiPatch(`/interactions/${interaction.id}/status`, { status: next });
      onStatusChanged();
    } catch (err) {
      setRowError({ id: interaction.id, message: (err as Error).message });
    } finally {
      setPendingId(null);
    }
  }

  if (rows.length === 0) {
    return <p className="py-8 text-center text-ink/60">No hay interacciones para estos filtros.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-muted text-ink/70">
        <tr>
          <th className="px-3 py-2">Agente</th>
          <th className="px-3 py-2">Tipo</th>
          <th className="px-3 py-2">Estado</th>
          <th className="px-3 py-2">Abierta</th>
          <th className="px-3 py-2">Cerrada</th>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const next = NEXT_STATUS[row.status];
          return (
            <tr key={row.id} className="border-b border-gray-100 align-top">
              <td className="px-3 py-2">{row.agent.name}</td>
              <td className="px-3 py-2 capitalize">{row.type}</td>
              <td className="px-3 py-2">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-3 py-2">{formatDateTime(row.openedAt)}</td>
              <td className="px-3 py-2">{formatDateTime(row.closedAt)}</td>
              <td className="px-3 py-2">
                {next && (
                  <button
                    type="button"
                    onClick={() => advanceStatus(row)}
                    disabled={pendingId === row.id}
                    className="w-20 rounded bg-ink px-2 py-1 text-center text-xs text-white disabled:opacity-40"
                  >
                    {pendingId === row.id ? '…' : NEXT_LABEL[row.status]}
                  </button>
                )}
                {rowError?.id === row.id && (
                  <p className="mt-1 text-xs text-red-700">{rowError.message}</p>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
