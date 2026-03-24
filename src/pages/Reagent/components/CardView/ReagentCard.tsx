import type { ReagentItem } from '@/types/reagent';
import StructureBox from '../StructureBox';

interface ReagentCardProps {
  reagent: ReagentItem;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onClick: (id: string) => void;
}

const META_ROWS: Array<{ label: string; getValue: (r: ReagentItem) => string; mono?: boolean }> = [
  { label: '핀 번호', getValue: (r) => r.pinCode,              mono: true },
  { label: 'CAS RN',  getValue: (r) => r.casNumber ?? '—',     mono: true },
  { label: '위치',    getValue: (r) => r.location },
  { label: '용량',    getValue: (r) => `${r.quantity} ${r.unit}` },
  { label: '공급자',  getValue: (r) => r.supplier ?? '—' },
];

const CONDITION_COLORS: Record<string, { bg: string; color: string }> = {
  'RT':    { bg: '#F0F2F6', color: '#6B7280' },
  '냉장':  { bg: '#E6F1FB', color: '#185FA5' },
  '냉동':  { bg: '#E1F5EE', color: '#0F6E56' },
  '극저온':{ bg: '#EDE9FE', color: '#5B21B6' },
  '차광':  { bg: '#FAEEDA', color: '#854F0B' },
  '위험물':{ bg: '#FCEBEB', color: '#A32D2D' },
  '불활성':{ bg: '#EAF3DE', color: '#3B6D11' },
};

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
        padding: '8px 30px 8px 12px',
        borderBottom: '1px solid var(--border)',
        minHeight: '46px',
      }}>
        {reagent.isReference && (
          <div style={{ marginBottom: '4px' }}>
            <span style={{
              fontSize: '9px', background: '#FAEEDA', color: '#854F0B',
              padding: '1px 6px', borderRadius: '6px', fontWeight: 500,
              border: '0.5px solid #EF9F27',
            }}>
              참조 · {reagent.originCabinetName}
            </span>
          </div>
        )}
        <div style={{
          fontSize: '12px', fontWeight: 500, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {reagent.compoundName}
        </div>
        {reagent.alias && (
          <div style={{ fontSize: '10px', color: 'var(--hint)', marginTop: '2px' }}>
            {reagent.alias}
          </div>
        )}
      </div>

      {/* 바디: 구조식 + 메타 */}
      <div style={{ display: 'flex', flex: 1 }}>
        <StructureBox smiles={reagent.smiles} variant="card" />

        {/* 메타 정보 */}
        <div style={{
          flex: 1, padding: '8px 10px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          rowGap: '3px', columnGap: '8px',
          alignContent: 'start',
        }}>
          {META_ROWS.map(({ label, getValue, mono }) => (
            <div key={label} style={{ display: 'contents' }}>
              <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--hint)', lineHeight: 1.65 }}>
                {label}
              </span>
              <span style={{
                fontSize: '11px', color: 'var(--muted)', lineHeight: 1.65,
                fontFamily: mono ? "'IBM Plex Mono', monospace" : 'inherit',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {getValue(reagent)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 보관조건 칩 */}
      {reagent.storageConditions && reagent.storageConditions.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '4px',
          padding: '6px 10px 8px',
          borderTop: '1px solid var(--border)',
        }}>
          {reagent.storageConditions.map((cond) => {
            const style = CONDITION_COLORS[cond] ?? { bg: '#F0F2F6', color: '#6B7280' };
            return (
              <span key={cond} style={{
                fontSize: '9px', padding: '1px 6px', borderRadius: '6px',
                background: style.bg, color: style.color, fontWeight: 500,
              }}>
                {cond}
              </span>
            );
          })}
        </div>
      )}
    </article>
  );
}
