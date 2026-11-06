/**
 * Simple pagination bar.
 * Props: page, totalPages, total, limit, onPageChange
 */
export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <span>Showing {from}–{to} of {total}</span>
      <div className="pagination-btns">
        <button className="pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ← Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((item, i) =>
            item === '...'
              ? <span key={`e${i}`} style={{ padding: '4px 6px' }}>…</span>
              : <button key={item} className={`pagination-btn${item === page ? ' active' : ''}`} onClick={() => onPageChange(item)}>{item}</button>
          )}
        <button className="pagination-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}
