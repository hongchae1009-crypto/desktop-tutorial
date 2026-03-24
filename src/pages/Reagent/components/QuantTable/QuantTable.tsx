/**
 * QuantTable — 시약 목록 테이블 뷰
 *
 * ┌────────────────────────────────────────────────── colspan 검증 공식 ──┐
 * │  QUANT_TABLE_COLUMN_COUNT = 8                                         │
 * │  Σ COLUMNS[i].colSpan  ===  QUANT_TABLE_COLUMN_COUNT                 │
 * │                                                                       │
 * │  규칙: 헤더를 그룹화하는 경우에도 모든 colSpan 합산 = 8을 보장해야    │
 * │  한다. 이를 어기면 개발 빌드에서 런타임 Error가 발생한다.             │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * 컬럼 순서 (FR-14):
 *   ① 체크박스(36px)  ② 핀 번호(88px)  ③ 구조식(80px)
 *   ④ 컴파운드(auto)  ⑤ CAS 번호(114px)  ⑥ 위치(100px)
 *   ⑦ 용량(74px)      ⑧ 공급자(116px)
 *
 * 상태 컬럼은 표시하지 않는다 (FR-15).
 */
import { useEffect, useRef } from 'react';
import type { ReagentItem, SortState, QuantTableColumn } from '@/types/reagent';
import { QUANT_TABLE_COLUMN_COUNT } from '@/types/reagent';
import StructureBox from '../StructureBox';

// ── 컬럼 정의 ─────────────────────────────────────────────────
const COLUMNS: QuantTableColumn[] = [
  { key: 'check',        label: '',         width: '36px',  align: 'center', colSpan: 1 },
  { key: 'pinCode',      label: '핀 번호',  width: '88px',  align: 'left',   colSpan: 1, sortable: true },
  { key: 'structure',    label: '구조식',   width: '80px',  align: 'center', colSpan: 1 },
  { key: 'compoundName', label: '컴파운드', width: undefined, align: 'left', colSpan: 1, sortable: true },
  { key: 'casNumber',    label: 'CAS 번호', width: '114px', align: 'left',   colSpan: 1, sortable: true },
  { key: 'location',     label: '위치',     width: '100px', align: 'left',   colSpan: 1, sortable: true },
  { key: 'quantity',     label: '용량',     width: '74px',  align: 'left',   colSpan: 1, sortable: true },
  { key: 'supplier',     label: '공급자',   width: '116px', align: 'left',   colSpan: 1 },
];

// ── colspan 검증 (개발 빌드 전용) ────────────────────────────
const colspanSum = COLUMNS.reduce((acc, c) => acc + c.colSpan, 0);
if (import.meta.env.DEV && colspanSum !== QUANT_TABLE_COLUMN_COUNT) {
  throw new Error(
    `[QuantTable] colspan 검증 실패: Σ colSpan = ${colspanSum}, 기대값 = ${QUANT_TABLE_COLUMN_COUNT}.\n` +
    `COLUMNS 배열을 수정하여 합산이 ${QUANT_TABLE_COLUMN_COUNT}이 되도록 맞춰야 합니다.`,
  );
}

// ── Props ──────────────────────────────────────────────────────
interface QuantTableProps {
  reagents: ReagentItem[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onRowClick: (id: string) => void;
  sortState: SortState;
  onSort: (key: keyof ReagentItem) => void;
}

// ── 컴포넌트 ───────────────────────────────────────────────────
export default function QuantTable({
  reagents,
  selectedIds,
  onSelect,
  onSelectAll,
  onRowClick,
  sortState,
  onSort,
}: QuantTableProps) {
  const allChecked     = reagents.length > 0 && reagents.every((r) => selectedIds.has(r.id));
  const someChecked    = reagents.some((r) => selectedIds.has(r.id));
  const indeterminate  = someChecked && !allChecked;
  const checkAllRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkAllRef.current) {
      checkAllRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  function sortIcon(key: string) {
    if (sortState.key !== key) return ' ↕';
    return sortState.dir === 'asc' ? ' ↑' : ' ↓';
  }

  if (reagents.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--hint)', fontSize: '13px',
      }}>
        검색 결과가 없습니다
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          {/* colgroup — 검증된 8개 컬럼 너비 */}
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>

          {/* thead */}
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              {COLUMNS.map((col) => {
                if (col.key === 'check') {
                  return (
                    <th key="check" style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <input
                        ref={checkAllRef}
                        type="checkbox"
                        checked={allChecked}
                        aria-label="전체 선택"
                        onChange={(e) => onSelectAll(e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: 'var(--blue)' }}
                      />
                    </th>
                  );
                }
                return (
                  <th
                    key={col.key}
                    colSpan={col.colSpan}
                    onClick={() => col.sortable && onSort(col.key as keyof ReagentItem)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '10px', fontWeight: 500,
                      color: 'var(--hint)',
                      textAlign: col.align ?? 'left',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      whiteSpace: 'nowrap',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    {col.label}
                    {col.sortable && (
                      <span style={{ fontSize: '9px', opacity: 0.6 }}>{sortIcon(col.key)}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* tbody */}
          <tbody>
            {reagents.map((r) => {
              const selected = selectedIds.has(r.id);
              return (
                <tr
                  key={r.id}
                  onClick={() => onRowClick(r.id)}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selected ? 'var(--blue-lt)' : 'transparent',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) (e.currentTarget as HTMLElement).style.background = 'var(--surface2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {/* ① 체크박스 */}
                  <td
                    style={{ padding: 0, verticalAlign: 'middle' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        aria-label={`${r.compoundName} 선택`}
                        onChange={(e) => onSelect(r.id, e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: 'var(--blue)' }}
                      />
                    </div>
                  </td>

                  {/* ② 핀 번호 */}
                  <td style={{ padding: 0, verticalAlign: 'middle' }}>
                    <div style={{ padding: '8px 12px' }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 500, color: 'var(--muted)' }}>
                        {r.pinCode}
                      </span>
                    </div>
                  </td>

                  {/* ③ 구조식 */}
                  <td style={{ padding: 0, verticalAlign: 'middle' }}>
                    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                      <StructureBox smiles={r.smiles} variant="table" />
                    </div>
                  </td>

                  {/* ④ 컴파운드 */}
                  <td style={{ padding: 0, verticalAlign: 'middle' }}>
                    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.compoundName}
                        </div>
                        {r.isReference && (
                          <span style={{
                            fontSize: '9px', background: '#FAEEDA', color: '#854F0B',
                            padding: '1px 6px', borderRadius: '6px', fontWeight: 500,
                            border: '0.5px solid #EF9F27', flexShrink: 0,
                          }}>
                            참조 · {r.originCabinetName}
                          </span>
                        )}
                      </div>
                      {r.alias && (
                        <div style={{ fontSize: '10px', color: 'var(--hint)', marginTop: '1px' }}>
                          {r.alias}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* ⑤ CAS 번호 */}
                  <td style={{ padding: 0, verticalAlign: 'middle' }}>
                    <div style={{ padding: '8px 12px' }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: 'var(--muted)' }}>
                        {r.casNumber ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* ⑥ 위치 */}
                  <td style={{ padding: 0, verticalAlign: 'middle' }}>
                    <div style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.location}</span>
                    </div>
                  </td>

                  {/* ⑦ 용량 */}
                  <td style={{ padding: 0, verticalAlign: 'middle' }}>
                    <div style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {r.quantity} {r.unit}
                      </span>
                    </div>
                  </td>

                  {/* ⑧ 공급자 */}
                  <td style={{ padding: 0, verticalAlign: 'middle' }}>
                    <div style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.supplier ?? '—'}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
