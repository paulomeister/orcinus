import { useState } from 'react';

interface MetricsFiltersProps {
  initialStart: string;
  initialEnd: string;
  onApply: (startDate: string, endDate: string) => void;
}

export function MetricsFilters({ initialStart, initialEnd, onApply }: MetricsFiltersProps) {
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(startDate, endDate);
      }}
      className="flex flex-wrap items-end gap-3 rounded bg-muted p-4"
    >
      <label className="flex flex-col text-sm">
        Desde
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1"
          required
        />
      </label>
      <label className="flex flex-col text-sm">
        Hasta
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1"
          required
        />
      </label>
      <button type="submit" className="rounded bg-ink px-4 py-1.5 text-sm text-white">
        Aplicar
      </button>
    </form>
  );
}
