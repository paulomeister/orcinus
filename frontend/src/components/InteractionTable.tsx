import type { Interaction } from '../api/types';
import { formatDateTime } from '../utils/format';
import { StatusBadge } from './StatusBadge';

export function InteractionTable({ rows }: { rows: Interaction[] }) {
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
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-gray-100">
            <td className="px-3 py-2">{row.agent.name}</td>
            <td className="px-3 py-2 capitalize">{row.type}</td>
            <td className="px-3 py-2">
              <StatusBadge status={row.status} />
            </td>
            <td className="px-3 py-2">{formatDateTime(row.openedAt)}</td>
            <td className="px-3 py-2">{formatDateTime(row.closedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
