import type { ReagentItem } from '@/types/reagent';
import StructureBox from '../StructureBox';

interface ReagentCardProps {
  reagent: ReagentItem;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onClick: (id: string) => void;
}

const META_ROWS: Array<{ label: string; getValue: (r: ReagentItem) => string; mono?: boolean }> = [
  { label: '핀 번호', getValue: (r) => r.pinCode,                 mono: true },
  { label: 'CAS RN',  getValue: (r) => r.casNumber ?? '—',        mono: true },
  { label: '위치',    getValue: (r) => r.location },
  { label: '용량',    getValue: (r) => `${r.quantity} ${r.unit}` },
  { label: '공급자',  getValue: (r) => r.supplier ?? '—' },
];

export default function ReagentCard({ reagent, selected, onSelect, onClick }: ReagentCardProps) {
  return (
    <article
      style={{
        background: 'var(--surface)',
        border: selected ? '1.5px solid var(--blue)' : '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color .15s, box-shadow .15s',
        boxShadow: selected ? '0 0 0 2px var(--blue)' : 'none',
      }}
      onClick={() => onClick(reagent.id)}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.borderColor = '#85B7EB';
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }
      }}
    >
      {/* 체크박스 (우상단) */}
      <div
        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          aria-label={`${reagent.compoundName} 선택`}
          onChange={(e) => onSelect(reagent.id, e.target.checked)}
          style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--blue)' }}
        />
      </div>

      {/* 컴파운드명 */}
      <div style={{
        padding: '10px 30px 8px 12px',
        borderBottom: '1px solid var(--border)',
        minHeight: '46px',
      }}>
        <div style={{
          fontSize: '12px', fontWeight: 500, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {reagent.compoundName}
        </div>
      </div>

      {/* 바디: 구조식 + 메타 */}
      <div style={{ display: 'flex', flex: 1 }}>
        <StructureBox smiles={reagent.smiles} variant="card" />

        {/* 메타 정보 */}
        <div style={{
          flex: 1, padding: '8px 10px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          rowGap: '4px', columnGap: '8px',
          alignContent: 'center',
        }}>
          {META_ROWS.map(({ label, getValue, mono }) => (
            <>
              <span key={`l-${label}`} style={{ fontSize: '10px', fontWeight: 500, color: 'var(--hint)', lineHeight: 1.65 }}>
                {label}
              </span>
              <span
                key={`v-${label}`}
                style={{
                  fontSize: '11px', color: 'var(--muted)', lineHeight: 1.65,
                  fontFamily: mono ? "'IBM Plex Mono', monospace" : 'inherit',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {getValue(reagent)}
              </span>
            </>
          ))}
        </div>
      </div>
    </article>
  );
}
