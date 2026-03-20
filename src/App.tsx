import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MoaCard } from './types/moa'
import { SAMPLE_CARDS } from './data/sample'
import MoaListPage from './pages/MoaList'
import MoaDetailPage from './pages/MoaDetail'

type View = 'list' | 'detail'

export default function App() {
  const [view, setView] = useState<View>('list')
  const [activeCard, setActiveCard] = useState<MoaCard | null>(null)
  const navigate = useNavigate()

  const goDetail = (card?: MoaCard) => {
    setActiveCard(card ?? SAMPLE_CARDS[0])
    setView('detail')
  }

  const goList = () => {
    setView('list')
    setActiveCard(null)
  }

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="logo">Jinu<span>note</span></div>
          <div className="bc">
            {view === 'list' ? '홈 / 모아 실험' : `홈 / 모아 실험 / ${activeCard?.title ?? ''}`}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="body-wrap">
        {/* SNB */}
        <nav className="snb">
          <div className="snb-title">내 연구실</div>
          <div className="snb-item">연구실 공지사항</div>
          <div className="snb-item">계정정보</div>
          <div className="snb-item">그룹</div>
          <div className="snb-item">프로젝트</div>
          <div className="snb-title">인벤토리</div>
          <div className="snb-item">시약 구매</div>
          <div className="snb-item">구매 현황</div>
          <div className="snb-item" onClick={() => navigate('/reagent')} style={{ cursor: 'pointer' }}>시약장</div>
          <div className="snb-item">소모품</div>
          <div className="snb-item">장비</div>
          <div className="snb-title">연구노트</div>
          <div className="snb-item">연구노트</div>
          <div className={`snb-item${view === 'list' || view === 'detail' ? ' active' : ''}`}>모아 실험</div>
          <div className="snb-item">랩북 피드</div>
        </nav>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {view === 'list' ? (
            <MoaListPage cards={SAMPLE_CARDS} onOpen={goDetail} />
          ) : (
            <MoaDetailPage card={activeCard!} onBack={goList} />
          )}
        </div>
      </div>
    </div>
  )
}
