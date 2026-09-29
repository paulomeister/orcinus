import { useState } from 'react';
import { apiPost } from '../api/client';
import type { Agent, Interaction, InteractionType } from '../api/types';

interface CreateInteractionFormProps {
  agents: Agent[];
  onCreated: () => void;
  onClose: () => void;
}

export function CreateInteractionForm({ agents, onCreated, onClose }: CreateInteractionFormProps) {
  const [agentId, setAgentId] = useState('');
  const [type, setType] = useState<InteractionType>('llamada');
  const [openedAt, setOpenedAt] = useState(''); // optional; left blank uses server default
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, string> = { agentId, type };
      if (openedAt) {
        // datetime-local has no timezone; interpret as-is and let the
        // browser's Date -> ISO conversion carry the offset.
        payload.openedAt = new Date(openedAt).toISOString();
      }

      await apiPost<Interaction>('/interactions', payload);
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-3 rounded bg-surface p-5 shadow-lg"
      >
        <h2 className="text-lg font-semibold">Nueva interacción</h2>

        <label className="flex flex-col text-sm">
          Agente
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            required
            className="rounded border border-gray-300 px-2 py-1"
          >
            <option value="" disabled>
              Selecciona un agente
            </option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          Tipo
          <select
            value={type}
            onChange={(e) => setType(e.target.value as InteractionType)}
            className="rounded border border-gray-300 px-2 py-1"
          >
            <option value="llamada">Llamada</option>
            <option value="ticket">Ticket</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          Fecha de apertura (opcional)
          <input
            type="datetime-local"
            value={openedAt}
            onChange={(e) => setOpenedAt(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-ink/70 hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !agentId}
            className="rounded bg-ink px-4 py-1.5 text-sm text-white disabled:opacity-40"
          >
            {submitting ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}
