import type { InteractionStatus } from '../api/types';

const STYLES: Record<InteractionStatus, string> = {
  resuelta: 'bg-green-100 text-green-800',
  en_progreso: 'bg-yellow-100 text-yellow-800',
  abierta: 'bg-gray-200 text-gray-700',
};

const LABELS: Record<InteractionStatus, string> = {
  resuelta: 'Resuelta',
  en_progreso: 'En progreso',
  abierta: 'Abierta',
};

export function StatusBadge({ status }: { status: InteractionStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
