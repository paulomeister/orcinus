import { useState } from 'react';
import { MetricsFilters } from '../components/MetricsFilters';
import { AgentMetricsTable } from '../components/AgentMetricsTable';
import { DailyVolumeChart } from '../components/DailyVolumeChart';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useMetrics } from '../hooks/useMetrics';

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 13); // last 14 days, mirrors the seed window
  const toStr = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toStr(start), end: toStr(end) };
}

export function MetricsPage() {
  const { start, end } = defaultRange();
  const [range, setRange] = useState({ startDate: start, endDate: end });

  const { data, loading, error } = useMetrics(range.startDate, range.endDate);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Métricas operacionales</h1>

      <MetricsFilters
        initialStart={range.startDate}
        initialEnd={range.endDate}
        onApply={(startDate, endDate) => setRange({ startDate, endDate })}
      />

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && data && (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-ink/70">Desempeño por agente</h2>
            <div className="overflow-x-auto rounded border border-gray-200">
              <AgentMetricsTable rows={data.agentMetrics} />
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-medium text-ink/70">Volumen diario</h2>
            <div className="rounded border border-gray-200 p-4">
              <DailyVolumeChart data={data.dailyVolume} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
