import type { AgentMetrics } from '../api/types';
import { formatMinutesSeconds } from '../utils/format';

export function AgentMetricsTable({ rows }: { rows: AgentMetrics[] }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-ink/60">Sin datos para este rango de fechas.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-muted text-ink/70">
        <tr>
          <th className="px-3 py-2">Agente</th>
          <th className="px-3 py-2">Total</th>
          <th className="px-3 py-2">Resueltas</th>
          <th className="px-3 py-2">Tasa de resolución</th>
          <th className="px-3 py-2">Tiempo prom. resolución</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.agentId} className="border-b border-gray-100">
            <td className="px-3 py-2">{row.agentName}</td>
            <td className="px-3 py-2">{row.totalInteractions}</td>
            <td className="px-3 py-2">{row.totalResolved}</td>
            <td className="px-3 py-2">{row.resolutionRate.toFixed(1)}%</td>
            <td className="px-3 py-2">{formatMinutesSeconds(row.avgResolutionSeconds)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
