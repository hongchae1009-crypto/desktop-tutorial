import type { Cabinet } from '@/types/reagent';
import { useToast } from './Toast';

interface CabinetTabBarProps {
  cabinets: Cabinet[];
  activeCabinetId: string;
  onTabChange: (id: string) => void;
  onAddCabinet: () => void;
}

export default function CabinetTabBar({
  cabinets,
  activeCabinetId,
  onTabChange,
  onAddCabinet,
}: CabinetTabBarProps) {
  const { showToast } = useToast();
  const favorite = cabinets.find((c) => c.isFavorite);
  const regular  = cabinets.filter((c) => !c.isFavorite);

  function tabStyle(cab: Cabinet): React.CSSProperties {
    const isActive = cab.id === activeCabinetId;
    const isFav    = cab.isFavorite;

    return {
      padding: '9px 15px',
      fontSize: '12px',
      cursor: 'pointer',
      color: isActive ? (isFav ? 'var(--amber)' : 'var(--blue)') : 'var(--muted)',
      borderBottom: isActive
        ? `2px solid ${isFav ? '#EF9F27' : 'var(--blue)'}`
        : '2px solid transparent',
      fontWeight: isActive ? 500 : 400,
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
      transition: 'color .12s',
      userSelect: 'none' as const,
    };
  }

  function countStyle(cab: Cabinet): React.CSSProperties {
    const isActive = cab.id === activeCabinetId;
    const isFav    = cab.isFavorite;

    return {
      fontSize: '10px',
      padding: '1px 5px',
      borderRadius: '8px',
      background: isActive
        ? isFav ? 'var(--amber-lt)' : 'var(--blue-lt)'
        : 'var(--surface2)',
      color: isActive
        ? isFav ? 'var(--amber)' : 'var(--blue)'
        : 'var(--hint)',
    };
  }

  return (
    <div style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {/* 자주쓰는 시약장 (고정) */}
      {favorite && (
        <button
          role="tab"
          aria-selected={favorite.id === activeCabinetId}
          style={{ ...tabStyle(favorite), background: 'none', border: 'none', borderBottom: tabStyle(favorite).borderBottom }}
          onClick={() => {
            onTabChange(favorite.id);
            showToast('자주쓰는 시약장으로 이동했습니다');
          }}
        >
          ⭐ {favorite.name}
          <span style={countStyle(favorite)}>{favorite.count}</span>
        </button>
      )}

      {/* 구분선 */}
      <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />

      {/* 개인 시약장 탭들 */}
      {regular.map((cab) => (
        <button
          key={cab.id}
          role="tab"
          aria-selected={cab.id === activeCabinetId}
          style={{ ...tabStyle(cab), background: 'none', border: 'none', borderBottom: tabStyle(cab).borderBottom }}
          onClick={() => {
            onTabChange(cab.id);
            showToast(`${cab.name}으로 이동했습니다`);
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cab.color, flexShrink: 0, display: 'inline-block' }} />
          {cab.name}
          <span style={countStyle(cab)}>{cab.count}</span>
        </button>
      ))}

      {/* 시약장 추가 */}
      <button
        style={{
          padding: '9px 12px', fontSize: '12px', color: 'var(--blue)',
          cursor: 'pointer', flexShrink: 0,
          background: 'none', border: 'none',
        }}
        onClick={onAddCabinet}
      >
        + 시약장 추가
      </button>
    </div>
  );
}
