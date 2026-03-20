/**
 * AddToCabinetPopover — 다른 시약장에 추가 팝오버
 * 현재 시약장 제외 목록, 이미있음 표시, 참조시약 생성
 */
import { useEffect, useRef } from 'react';
import type { Cabinet, ReagentItem } from '@/types/reagent';

interface AddToCabinetPopoverProps {
  cabinets: Cabinet[];
  activeCabinetId: string;
  basketItems: ReagentItem[];
  allReagents: ReagentItem[];
  onAdd: (targetCabId: string, toAddIds: string[], alreadyCount: number) => void;
  onClose: () => void;
}

export default function AddToCabinetPopover({
  cabinets,
  activeCabinetId,
  basketItems,
  allReagents,
  onAdd,
  onClose,
}: AddToCabinetPopoverProps) {
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  function handleSelect(cab: Cabinet) {
    if (cab.id === activeCabinetId) return;

    const basketIds = basketItems.map((r) => r.id);

    // 이미 해당 시약장에 있는 시약 확인
    const alreadyIn = basketIds.filter((id) => {
      const r = allReagents.find((x) => x.id === id);
      return r && (
        r.cabinetId === cab.id ||
        (r.referencedIn && r.referencedIn.includes(cab.id))
      );
    });
    const toAdd = basketIds.filter((id) => !alreadyIn.includes(id));

    onAdd(cab.id, toAdd, alreadyIn.length);
    onClose();
  }

  return (
    <div
      ref={popRef}
      style={{
        position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
        background: '#fff', border: '1px solid rgba(0,0,0,.12)',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,.12),0 1px 4px rgba(0,0,0,.06)',
        zIndex: 500, overflow: 'hidden',
      }}
    >
      <div style={{ padding: '9px 12px 7px', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
        시약장 선택
      </div>
      {cabinets.map((cab) => {
        const isCurrent = cab.id === activeCabinetId;

        // 이미 있는 시약 수 계산
        const basketIds = basketItems.map((r) => r.id);
        const alreadyCount = basketIds.filter((id) => {
          const r = allReagents.find((x) => x.id === id);
          return r && (r.cabinetId === cab.id || (r.referencedIn && r.referencedIn.includes(cab.id)));
        }).length;
        const hasAlready = alreadyCount > 0 && !isCurrent;

        return (
          <div
            key={cab.id}
            onClick={() => handleSelect(cab)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 12px', cursor: isCurrent ? 'not-allowed' : 'pointer',
              fontSize: '12px', color: 'var(--text)',
              transition: 'background .1s',
              opacity: isCurrent ? 0.45 : 1,
            }}
            onMouseEnter={(e) => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {cab.isFavorite
              ? <span style={{ fontSize: '11px' }}>⭐</span>
              : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cab.color, flexShrink: 0 }} />
            }
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cab.name}
              {isCurrent && <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: '2px' }}>(현재)</span>}
            </span>
            {hasAlready && (
              <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '8px', background: '#FAEEDA', color: '#854F0B', border: '.5px solid #EF9F27', cursor: 'default', flexShrink: 0, lineHeight: 1.4 }}>
                {alreadyCount}개 있음
              </span>
            )}
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{cab.count}</span>
          </div>
        );
      })}
    </div>
  );
}
