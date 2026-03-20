import type { RecentSearch } from '@/types/reagent';
import { timeAgo } from '@/utils/timeAgo';

interface RecentSearchChipsProps {
  searches: RecentSearch[];
  onChipClick: (keyword: string) => void;
}

export default function RecentSearchChips({ searches, onChipClick }: RecentSearchChipsProps) {
  if (searches.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flexWrap: 'nowrap' }}>
      <span style={{
        fontSize: '10px', fontWeight: 500, color: 'var(--hint)',
        textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
      }}>
        최근 검색
      </span>

      {searches.slice(0, 5).map((s) => (
        <button
          key={s.keyword}
          onClick={() => onChipClick(s.keyword)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 9px', borderRadius: '20px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            fontSize: '11px', color: 'var(--muted)',
            cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'border-color .12s, color .12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--blue-mid)';
            e.currentTarget.style.color = 'var(--blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--muted)';
          }}
        >
          {s.keyword}
          <span style={{ fontSize: '9px', color: 'var(--hint)' }}>{timeAgo(s.searchedAt)}</span>
        </button>
      ))}
    </div>
  );
}
