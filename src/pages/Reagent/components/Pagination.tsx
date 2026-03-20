import { buildPageItems } from '@/utils/pagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = buildPageItems(currentPage, totalPages);

  function pgBtn(content: string | number, active: boolean, disabled: boolean, onClick: () => void) {
    return (
      <button
        key={String(content)}
        disabled={disabled}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
        style={{
          width: '26px', height: '26px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--r)', fontSize: '11px',
          cursor: disabled ? 'default' : 'pointer',
          border: active ? '1px solid var(--blue)' : '1px solid transparent',
          background: active ? 'var(--blue)' : 'transparent',
          color: active ? '#fff' : disabled ? 'var(--hint)' : 'var(--muted)',
          transition: 'background .1s, border-color .1s',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
      {pgBtn('‹', false, currentPage === 1, () => onChange(currentPage - 1))}

      {items.map((item, i) =>
        item === '···'
          ? <span key={`ellipsis-${i}`} style={{ width: '26px', textAlign: 'center', fontSize: '11px', color: 'var(--hint)' }}>···</span>
          : pgBtn(item, item === currentPage, false, () => onChange(item as number))
      )}

      {pgBtn('›', false, currentPage === totalPages, () => onChange(currentPage + 1))}
    </div>
  );
}
