interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded bg-ink px-3 py-1.5 text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        Anterior
      </button>
      <span className="text-ink/70">
        Página {page} de {Math.max(totalPages, 1)}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded bg-ink px-3 py-1.5 text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        Siguiente
      </button>
    </div>
  );
}
