import { useState, useMemo } from 'react';
import type { NoteReagentRole, NoteReagentRow } from '@/types/note';
import { ROLE_LABEL, ROLE_COLOR } from '@/types/note';
import { MOCK_REAGENTS, MOCK_CABINETS } from '@/data/reagentData';
import type { ReagentItem } from '@/types/reagent';

interface Props {
  onAdd: (rows: NoteReagentRow[]) => void;
  onClose: () => void;
}

const ALL_TAB = '__ALL__';

export default function ReagentPickerModal({ onAdd, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeCab, setActiveCab] = useState(ALL_TAB);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<NoteReagentRole>('reagent');

  const cabinets = MOCK_CABINETS.filter((c) => !c.isFavorite);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return MOCK_REAGENTS.filter((r) => {
      if (r.isReference) return false;
      if (activeCab !== ALL_TAB && r.cabinetId !== activeCab) return false;
      if (!kw) return true;
      return (
        r.compoundName.toLowerCase().includes(kw) ||
        (r.alias ?? '').toLowerCase().includes(kw) ||
        (r.casNumber ?? '').includes(kw) ||
        r.pinCode.toLowerCase().includes(kw)
      );
    });
  }, [query, activeCab]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleAdd() {
    if (selected.size === 0) return;
    const rows: NoteReagentRow[] = Array.from(selected).map((id) => {
      const r = MOCK_REAGENTS.find((x) => x.id === id)!;
      const cab = MOCK_CABINETS.find((c) => c.id === r.cabinetId);
      return {
        id: `rr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        reagentId: r.id,
        cabinetName: cab?.name,
        role,
        compoundName: r.compoundName,
        alias: r.alias,
        casNumber: r.casNumber,
        mw: r.mw,
        amount: '',
        mmol: undefined,
        eq: undefined,
      };
    });
    onAdd(rows);
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 600, background: 'var(--bg, #fff)',
        borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,.18)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        maxHeight: '80vh',
      }}>
        {/* 헤더 */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--bd)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>🧪 시약장에서 시약 추가</span>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 18, color: 'var(--tx3)', lineHeight: 1,
            }}
          >×</button>
        </div>

        {/* 검색 */}
        <div style={{ padding: '10px 18px 0', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--tx3)', fontSize: 13,
            }}>🔍</span>
            <input
              type="text"
              placeholder="화합물명, CAS, 핀번호로 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '8px 10px 8px 30px',
                border: '1px solid var(--bd2)', borderRadius: 8,
                fontSize: 12, background: 'var(--bg2)', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* 시약장 탭 */}
        <div style={{
          display: 'flex', gap: 4, padding: '8px 18px',
          flexShrink: 0, overflowX: 'auto',
        }}>
          <CabTab
            label="전체"
            active={activeCab === ALL_TAB}
            onClick={() => setActiveCab(ALL_TAB)}
          />
          {cabinets.map((c) => (
            <CabTab
              key={c.id}
              label={c.name}
              color={c.color}
              active={activeCab === c.id}
              onClick={() => setActiveCab(c.id)}
            />
          ))}
        </div>

        {/* 시약 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--bd)' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--tx3)', fontSize: 12 }}>
              검색 결과가 없습니다
            </div>
          ) : (
            filtered.map((r) => (
              <ReagentRow
                key={r.id}
                reagent={r}
                checked={selected.has(r.id)}
                onToggle={() => toggle(r.id)}
              />
            ))
          )}
        </div>

        {/* 푸터 */}
        <div style={{
          padding: '12px 18px', borderTop: '1px solid var(--bd)',
          background: 'var(--bg2)', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* 역할 선택 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--tx3)', fontWeight: 500 }}>역할</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(Object.keys(ROLE_LABEL) as NoteReagentRole[]).map((r) => {
                const rc = ROLE_COLOR[r];
                const isActive = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      padding: '3px 9px', borderRadius: 10, fontSize: 10, cursor: 'pointer',
                      fontWeight: isActive ? 600 : 400,
                      border: `1px solid ${isActive ? rc.border : 'var(--bd)'}`,
                      background: isActive ? rc.bg : 'transparent',
                      color: isActive ? rc.color : 'var(--tx3)',
                      transition: 'all .12s',
                    }}
                  >{ROLE_LABEL[r]}</button>
                );
              })}
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {selected.size > 0 && (
              <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 500 }}>
                {selected.size}개 선택됨
              </span>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                border: '1px solid var(--bd2)', background: 'var(--bg)', color: 'var(--tx2)',
              }}
            >취소</button>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 12, cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                border: 'none',
                background: selected.size > 0 ? 'var(--blue)' : 'var(--bd)',
                color: selected.size > 0 ? '#fff' : 'var(--tx3)',
                fontWeight: 500, transition: 'background .12s',
              }}
            >추가하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트 ───────────────────────────────────────────

function CabTab({ label, color, active, onClick }: {
  label: string; color?: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 11px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
        border: `1px solid ${active ? (color ?? 'var(--blue)') : 'var(--bd)'}`,
        background: active ? (color ? `${color}18` : 'var(--blue-bg)') : 'transparent',
        color: active ? (color ?? 'var(--blue)') : 'var(--tx3)',
        fontWeight: active ? 600 : 400,
        flexShrink: 0,
        transition: 'all .12s',
      }}
    >{label}</button>
  );
}

function ReagentRow({ reagent, checked, onToggle }: {
  reagent: ReagentItem; checked: boolean; onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 18px', cursor: 'pointer',
        borderBottom: '1px solid var(--bd)',
        background: checked ? 'var(--blue-bg, #e8f0fa)' : 'transparent',
        transition: 'background .1s',
      }}
      onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'; }}
      onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* 체크박스 */}
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        border: `2px solid ${checked ? 'var(--blue)' : 'var(--bd2)'}`,
        background: checked ? 'var(--blue)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .1s',
      }}>
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* 핀코드 */}
      <span style={{ fontSize: 10, color: 'var(--tx3)', fontFamily: 'monospace', flexShrink: 0, width: 56 }}>
        {reagent.pinCode}
      </span>

      {/* 화합물명 + 명칭 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {reagent.compoundName}
        </div>
        {reagent.alias && (
          <div style={{ fontSize: 10, color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {reagent.alias}
          </div>
        )}
      </div>

      {/* CAS */}
      {reagent.casNumber && (
        <span style={{ fontSize: 10, color: 'var(--tx3)', fontFamily: 'monospace', flexShrink: 0 }}>
          {reagent.casNumber}
        </span>
      )}

      {/* MW */}
      {reagent.mw && (
        <span style={{ fontSize: 10, color: 'var(--tx2)', flexShrink: 0, width: 52, textAlign: 'right' }}>
          {reagent.mw}
        </span>
      )}

      {/* 재고 */}
      <span style={{ fontSize: 10, color: 'var(--tx3)', flexShrink: 0, width: 54, textAlign: 'right' }}>
        {reagent.quantity} {reagent.unit}
      </span>
    </div>
  );
}
