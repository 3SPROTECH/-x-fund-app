import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="btn btn-sm">
        <ChevronLeft size={16} />
      </button>
      <span>Page {page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="btn btn-sm">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
