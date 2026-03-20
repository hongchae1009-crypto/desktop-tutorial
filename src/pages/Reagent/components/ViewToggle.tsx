import type { ViewMode } from '@/types/reagent';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  function btn(mode: ViewMode, icon: string, label: string) {
    const active = view === mode;
    return (
      <button
        aria-label={label}
        aria-pressed={active}
        title={label}
        onClick={() => onChange(mode)}
        style={{
          padding: '5px 9px',
          fontSize: '13px',
          borderRadius: 'var(--r)',
          cursor: 'pointer',
          border: '1px solid var(--border2)',
          background: active ? 'var(--blue-lt)' : 'var(--surface2)',
          color: active ? 'var(--blue)' : 'var(--muted)',
          borderColor: active ? '#85B7EB' : 'var(--border2)',
          transition: 'background .12s',
        }}
      >
        {icon}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {btn('table', '☰', '테이블 뷰')}
      {btn('card',  '⊞', '카드 뷰')}
    </div>
  );
}
