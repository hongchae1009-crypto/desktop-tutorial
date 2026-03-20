import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MoaCard } from '../../types/moa';
import MoaListView from './MoaListView';
import MoaDetailView from './MoaDetailView';

// ── 샘플 카드 데이터 ─────────────────────────────────────
const SAMPLE_CARDS: MoaCard[] = [
  {
    id: 'MB-PRI-HCE-2026-00001',
    title: 'HCE-260309',
    project: '2026 Piperazine',
    status: 'active',
    expCount: 3,
    bestYield: 72,
    yieldHistory: [
      { id: 'HCE-1', yield: 72 },
      { id: 'HCE-2', yield: 62 },
      { id: 'HCE-3', yield: null },
    ],
    author: '제은',
    createdAt: '2026-03-09',
  },
  {
    id: 'MB-PRI-HCE-2026-00002',
    title: 'HCE-260215 Amide coupling',
    project: '2026 Amide',
    status: 'done',
    expCount: 6,
    bestYield: 89,
    yieldHistory: [
      { id: 'HCE-1', yield: 78 },
      { id: 'HCE-2', yield: 89 },
    ],
    author: '제은',
    createdAt: '2026-02-15',
  },
  {
    id: 'MB-PRI-HCE-2026-00003',
    title: 'HCE-260301 Reductive amination',
    project: '2026 Piperazine',
    status: 'draft',
    expCount: 5,
    bestYield: null,
    yieldHistory: [{ id: 'HCE-1', yield: null }],
    author: '제은',
    createdAt: '2026-03-01',
  },
  {
    id: 'MB-PRI-HCE-2025-00047',
    title: 'HCE-251120 Suzuki coupling',
    project: '2025 Scaffold',
    status: 'done',
    expCount: 8,
    bestYield: 94,
    yieldHistory: [
      { id: 'HCE-4', yield: 94 },
      { id: 'HCE-7', yield: 80 },
    ],
    author: '제은',
    createdAt: '2025-11-20',
  },
];

type View = { mode: 'list' } | { mode: 'detail'; card: MoaCard };

const MoaExperiment: React.FC = () => {
  const [view, setView] = useState<View>({ mode: 'list' });
  const [cards, setCards] = useState<MoaCard[]>(SAMPLE_CARDS);
  const navigate = useNavigate();

  const goDetail = (card: MoaCard) => setView({ mode: 'detail', card });
  const goList = () => setView({ mode: 'list' });

  const handleNew = () => {
    const newCard: MoaCard = {
      id: `MB-PRI-HCE-2026-${String(cards.length + 1).padStart(5, '0')}`,
      title: `HCE-새실험`,
      project: '2026 Piperazine',
      status: 'draft',
      expCount: 0,
      bestYield: null,
      yieldHistory: [],
      author: '제은',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setCards(prev => [newCard, ...prev]);
    goDetail(newCard);
  };

  const currentCard = view.mode === 'detail' ? view.card : null;

  return (
    <div style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',-apple-system,sans-serif", fontSize: 12, color: '#1a1c21', background: '#f0f1f4', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── Topbar ── */}
      <div style={{ height: 42, flexShrink: 0, background: '#fff', borderBottom: '0.5px solid #e2e4e9', padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1a6bb5', letterSpacing: -0.3 }}>
            Jinu<span style={{ color: '#1a1c21' }}>note</span>
          </div>
          <div style={{ fontSize: 10, color: '#9099aa', marginLeft: 10 }}>
            홈 / 모아 실험{currentCard ? ` / ${currentCard.title}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {view.mode === 'detail' && (
            <>
              <button
                onClick={goList}
                style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5, border: '0.5px solid #b5d4f4', background: '#fff', color: '#1a6bb5', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                ← 목록
              </button>
              <button style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5, border: '0.5px solid #e2e4e9', background: '#fff', color: '#1a1c21', cursor: 'pointer', fontFamily: 'inherit' }}>
                되돌리기
              </button>
              <button style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5, border: '0.5px solid #e2e4e9', background: '#fff', color: '#1a1c21', cursor: 'pointer', fontFamily: 'inherit' }}>
                프린트
              </button>
              <button style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5, border: '0.5px solid #e2e4e9', background: '#1a6bb5', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                저장
              </button>
              <button style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5, border: '0.5px solid #e2e4e9', background: '#fff', color: '#1a1c21', cursor: 'pointer', fontFamily: 'inherit' }}>
                닫기
              </button>
              <button style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5, border: '0.5px solid #fca5a5', background: '#fff', color: '#c0392b', cursor: 'pointer', fontFamily: 'inherit' }}>
                삭제
              </button>
            </>
          )}
          <button
            onClick={handleNew}
            style={{ fontSize: 11, padding: '4px 11px', borderRadius: 5, border: '0.5px solid #1a6bb5', background: '#1a6bb5', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + 새 모아 실험
          </button>
        </div>
      </div>

      {/* ── Metabar ── */}
      <div style={{ height: 34, flexShrink: 0, background: '#fff', borderBottom: '0.5px solid #e2e4e9', padding: '0 18px', display: 'flex', alignItems: 'center' }}>
        {view.mode === 'list' ? (
          <>
            <MetaItem label="연구노트" value="모아 실험 목록" />
            <MetaItem label="프로젝트" value="2026 Piperazine" />
            <MetaItem label="총 실험" value={`${cards.length}건`} last />
          </>
        ) : (
          <>
            <MetaItem label="실험번호" value={currentCard?.id ?? ''} />
            <MetaItem label="실험명">
              <input defaultValue={currentCard?.title} style={{ fontSize: 12, padding: '2px 6px', border: '0.5px solid #d0d4dc', borderRadius: 4, background: '#f7f8fa', color: '#1a1c21', width: 130, fontFamily: 'inherit', outline: 'none' }} />
            </MetaItem>
            <MetaItem label="프로젝트">
              <input defaultValue={currentCard?.project} style={{ fontSize: 12, padding: '2px 6px', border: '0.5px solid #d0d4dc', borderRadius: 4, background: '#f7f8fa', color: '#1a1c21', width: 130, fontFamily: 'inherit', outline: 'none' }} />
            </MetaItem>
            <MetaItem label="작성자" value={currentCard?.author ?? ''} />
            <MetaItem label="생성일" value={currentCard?.createdAt ?? ''} last />
          </>
        )}
      </div>

      {/* ── 뷰 ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view.mode === 'list' ? (
          <MoaListView cards={cards} onSelect={goDetail} onNew={handleNew} />
        ) : (
          <MoaDetailView card={view.card} onBack={goList} />
        )}
      </div>
    </div>
  );
};

// ── MetaItem ─────────────────────────────────────────────
const MetaItem: React.FC<{
  label: string;
  value?: string;
  last?: boolean;
  children?: React.ReactNode;
}> = ({ label, value, last, children }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 5, padding: '0 14px',
    borderRight: last ? 'none' : '0.5px solid #e2e4e9',
  }}>
    <span style={{ fontSize: 9, color: '#9099aa', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
      {label}
    </span>
    {children ?? <span style={{ fontSize: 12, fontWeight: 500 }}>{value}</span>}
  </div>
);

export default MoaExperiment;
