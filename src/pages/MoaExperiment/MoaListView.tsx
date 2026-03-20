import React from 'react';
import type { MoaCard, MoaStatus } from '../../types/moa';
import { BARS } from '../../utils/moa';

interface MoaListViewProps {
  cards: MoaCard[];
  onSelect: (card: MoaCard) => void;
  onNew: () => void;
}

const STATUS_LABEL: Record<MoaStatus, string> = {
  draft: '초안',
  active: '진행 중',
  done: '완료',
};
const STATUS_STYLE: Record<MoaStatus, React.CSSProperties> = {
  draft: { background: '#f2f3f5', color: '#888', borderColor: '#ccc' },
  active: { background: '#e8f0fa', color: '#1a6bb5', borderColor: '#b5d4f4' },
  done: { background: '#eaf3de', color: '#3B6D11', borderColor: '#9FE1CB' },
};

const MoaListView: React.FC<MoaListViewProps> = ({ cards, onSelect, onNew }) => {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<MoaStatus | 'all'>('all');

  const filtered = cards.filter(c => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const btnStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 11, padding: '4px 11px', borderRadius: 5,
    border: active ? '0.5px solid #b5d4f4' : '0.5px solid #e2e4e9',
    background: active ? '#e8f0fa' : '#fff',
    color: active ? '#1a6bb5' : '#1a1c21',
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600 }}>모아 실험 목록</h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="실험명 또는 번호 검색..."
            style={{
              padding: '5px 10px', border: '0.5px solid #d0d4dc', borderRadius: 5,
              fontSize: 11, background: '#f7f8fa', color: '#1a1c21', width: 210, outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {(['all', 'active', 'done'] as const).map(s => (
            <button key={s} style={btnStyle(statusFilter === s)} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? '전체' : s === 'active' ? '진행 중' : '완료'}
            </button>
          ))}
        </div>
      </div>

      {/* 카드 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {filtered.map(card => (
          <div
            key={card.id}
            onClick={() => onSelect(card)}
            style={{
              background: '#fff', border: '0.5px solid #e2e4e9', borderRadius: 10,
              padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s, background .15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#b5d4f4';
              (e.currentTarget as HTMLDivElement).style.background = '#f7fbff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e4e9';
              (e.currentTarget as HTMLDivElement).style.background = '#fff';
            }}
          >
            <div style={{ fontSize: 9, color: '#9099aa', fontFamily: 'monospace', marginBottom: 3 }}>{card.id}</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {card.title}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
              <span style={{
                fontSize: 9, padding: '1px 7px', borderRadius: 8, border: '0.5px solid',
                ...STATUS_STYLE[card.status],
              }}>
                {STATUS_LABEL[card.status]}
              </span>
              <span style={{ fontSize: 9, color: '#9099aa' }}>{card.project}</span>
            </div>

            {/* 통계 */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderTop: '0.5px solid #e2e4e9', paddingTop: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 8, color: '#9099aa' }}>실험 수</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{card.expCount}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 8, color: '#9099aa' }}>최고 yield</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: card.bestYield !== null ? '#1D9E75' : '#9099aa' }}>
                  {card.bestYield !== null ? `${card.bestYield}%` : '—'}
                </span>
              </div>
              {/* 미니 바 차트 */}
              <div style={{ flex: 1 }}>
                {card.yieldHistory.slice(0, 3).map((y, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <div style={{ fontSize: 8, color: '#999', width: 30, overflow: 'hidden', textOverflow: 'ellipsis' }}>{y.id}</div>
                    <div style={{ flex: 1, height: 6, background: '#eee', borderRadius: 2, overflow: 'hidden' }}>
                      {y.yield !== null && (
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${Math.min(y.yield, 100)}%`,
                          background: BARS[i % BARS.length],
                        }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 9, color: '#9099aa', marginTop: 8 }}>
              {card.createdAt} · {card.author}
            </div>
          </div>
        ))}

        {/* 새 모아 실험 추가 버튼 */}
        <div
          onClick={onNew}
          style={{
            background: '#f7f8fa', border: '0.5px dashed #d0d4dc', borderRadius: 10,
            padding: '14px 16px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', minHeight: 140,
            color: '#9099aa', fontSize: 11, gap: 5, transition: 'border-color .15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#b5d4f4'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#d0d4dc'}
        >
          <span style={{ fontSize: 16 }}>+</span> 새 모아 실험
        </div>
      </div>
    </div>
  );
};

export default MoaListView;
