import type { ReagentItem } from '@/types/reagent';
import ReagentCard from './ReagentCard';

interface CardViewProps {
  reagents: ReagentItem[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onCardClick: (id: string) => void;
}

export default function CardView({ reagents, selectedIds, onSelect, onCardClick }: CardViewProps) {
  if (reagents.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--hint)', fontSize: '13px',
      }}>
        검색 결과가 없습니다
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '9px',
      flex: 1,
      overflowY: 'auto',
      alignContent: 'start',
      paddingBottom: '4px',
    }}>
      {reagents.map((r) => (
        <ReagentCard
          key={r.id}
          reagent={r}
          selected={selectedIds.has(r.id)}
          onSelect={onSelect}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
