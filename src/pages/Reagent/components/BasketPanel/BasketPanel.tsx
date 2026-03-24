/**
 * BasketPanel — 선택한 시약 장바구니 패널 (우측 고정 200px)
 *
 * 상태 유지 규칙 (FR-20):
 *   페이지네이션 / 검색 / 탭 전환 / 뷰 전환 → 상태 유지 (Zustand로 보장)
 *   개별 ✕ → 해당 항목만 제거
 *   전체 해제 → 전체 초기화
 *   API 완료 후 → 초기화
 */
import { useState } from 'react';
import StructureBox from '../StructureBox';
import { useBasketStore } from '@/store/basketStore';
import type { Cabinet, ReagentItem } from '@/types/reagent';
import AddToCabinetPopover from './AddToCabinetPopover';

interface BasketPanelProps {
  cabinets: Cabinet[];
  activeCabinetId: string;
  allReagents: ReagentItem[];
  isFavTab: boolean;
  onAddToFav: () => void;
  onRemoveFromFav: () => void;
  onAddToOtherCabinet: (targetCabId: string, toAddIds: string[], alreadyCount: number) => void;
  onSendToMoa?: () => void;
}

export default function BasketPanel({
  cabinets,
  activeCabinetId,
  allReagents,
  isFavTab,
  onAddToFav,
  onRemoveFromFav,
  onAddToOtherCabinet,
  onSendToMoa,
}: BasketPanelProps) {
  const { items, remove, clear } = useBasketStore();
  const itemList = Object.values(items);
  const count = itemList.length;
  const [showPopover, setShowPopover] = useState(false);

  // ReagentItem 조회
  const basketReagents: ReagentItem[] = itemList
    .map((item) => allReagents.find((r) => r.id === item.id))
    .filter((r): r is ReagentItem => !!r);

  function handleFavBtn() {
    if (isFavTab) {
      onRemoveFromFav();
    } else {
      onAddToFav();
    }
  }

  return (
    <aside
      aria-label="선택한 시약 장바구니"
      style={{
        width: '200px', flexShrink: 0,
        background: 'var(--surface)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div style={{
        padding: '12px 14px 10px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
      }}>
        <span style={{ fontSize: '12px', fontWeight: 500 }}>선택한 시약</span>
        {count > 0 && (
          <span style={{ fontSize: '10px', background: 'var(--blue)', color: '#fff', padding: '1px 7px', borderRadius: '10px' }}>
            {count}
          </span>
        )}
        <button
          onClick={clear}
          aria-label="전체 해제"
          style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--hint)', cursor: 'pointer', background: 'none', border: 'none', transition: 'color .12s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--hint)')}
        >
          전체 해제
        </button>
      </div>

      {/* 아이템 목록 / 빈 상태 */}
      {count === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '28px', opacity: 0.2 }}>🧪</span>
          <p style={{ fontSize: '11px', color: 'var(--hint)', lineHeight: 1.6 }}>
            시약을 체크하면<br />여기에 모아져요
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '9px 9px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {itemList.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', overflow: 'hidden', position: 'relative', flexShrink: 0, transition: 'border-color .12s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#85B7EB')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <StructureBox smiles={item.smiles} variant="basket" />
              <div style={{ padding: '6px 22px 7px 8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 500, lineHeight: 1.35, color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--hint)', fontFamily: "'IBM Plex Mono', monospace", marginTop: '2px' }}>
                  {item.pinCode}
                </div>
              </div>
              <button
                aria-label={`${item.name} 제거`}
                onClick={() => remove(item.id)}
                style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', color: 'var(--hint)', cursor: 'pointer', lineHeight: 1,
                  transition: 'background .12s, color .12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-lt)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = '#F09595'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--hint)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                ✕
              </button>
            </div>
          ))}
          <div style={{ height: '8px', flexShrink: 0 }} />
        </div>
      )}

      {/* 액션 버튼 */}
      {count > 0 && (
        <div style={{ padding: '10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, position: 'relative' }}>
          {/* AddToCabinet Popover */}
          {showPopover && (
            <AddToCabinetPopover
              cabinets={cabinets}
              activeCabinetId={activeCabinetId}
              basketItems={basketReagents}
              allReagents={allReagents}
              onAdd={(targetCabId, toAddIds, alreadyCount) => {
                onAddToOtherCabinet(targetCabId, toAddIds, alreadyCount);
              }}
              onClose={() => setShowPopover(false)}
            />
          )}

          <button
            onClick={(e) => { e.stopPropagation(); setShowPopover((v) => !v); }}
            style={{ width: '100%', padding: '7px', fontSize: '11px', fontFamily: 'inherit', borderRadius: 'var(--r)', cursor: 'pointer', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted)', textAlign: 'center', transition: 'background .12s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            📂 다른 시약장에 추가
          </button>

          <button
            onClick={handleFavBtn}
            style={{
              width: '100%', padding: '7px', fontSize: '11px', fontFamily: 'inherit',
              borderRadius: 'var(--r)', cursor: 'pointer', border: '1px solid var(--border2)',
              background: 'transparent', textAlign: 'center', transition: 'background .12s',
              color: isFavTab ? 'var(--red)' : 'var(--muted)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {isFavTab ? '🗑 자주쓰는 시약장에서 삭제' : '⭐ 자주쓰는 시약장에 추가'}
          </button>

          <button
            onClick={onSendToMoa}
            disabled={!onSendToMoa || count === 0}
            style={{
              width: '100%', padding: '7px', fontSize: '11px', fontFamily: 'inherit',
              borderRadius: 'var(--r)', cursor: (onSendToMoa && count > 0) ? 'pointer' : 'not-allowed',
              border: '1px solid var(--blue)', background: 'var(--blue)', color: '#fff',
              textAlign: 'center', transition: 'background .12s',
              opacity: (onSendToMoa && count > 0) ? 1 : 0.5,
            }}
            onMouseEnter={(e) => { if (onSendToMoa && count > 0) e.currentTarget.style.background = '#0C447C'; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--blue)')}
          >
            모아실험으로 넘기기
          </button>
        </div>
      )}
    </aside>
  );
}
