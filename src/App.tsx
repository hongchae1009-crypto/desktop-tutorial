import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MoaCard } from './types/moa'
import { fetchCards } from './services/moaService'
import { SUPABASE_READY } from './utils/supabase'
import { useIsMobile } from './hooks/useIsMobile'
import MoaListPage from './pages/MoaList'
import MoaDetailPage from './pages/MoaDetail'

type View = 'list' | 'detail'

const SNB_SECTIONS = (activePage: string, onNavigate: (path: string) => void) => [
  { label: '정보', items: [{ icon: '💬', name: '나의질문', active: false, badge: '', onClick: undefined }] },
  { label: '내 연구실', items: [
    { icon: '📢', name: '연구실 공지사항', active: false, badge: '', onClick: undefined },
    { icon: '⚙️', name: '계정정보', active: false, badge: '', onClick: undefined },
    { icon: '👥', name: '그룹', active: false, badge: '', onClick: undefined },
    { icon: '📁', name: '프로젝트', active: false, badge: '', onClick: undefined },
  ]},
  { label: '인벤토리', items: [
    { icon: '🛒', name: '시약 구매', active: false, badge: '', onClick: undefined },
    { icon: '📋', name: '구매 현황', active: false, badge: '', onClick: undefined },
    { icon: '🧪', name: '시약장', active: activePage === 'reagent', badge: '', onClick: () => onNavigate('/reagent') },
    { icon: '📦', name: '소모품', active: false, badge: '', onClick: undefined },
    { icon: '🔬', name: '장비', active: false, badge: '', onClick: undefined },
  ]},
  { label: '연구노트', items: [
    { icon: '📓', name: '연구노트', active: activePage === 'note', badge: '', onClick: () => onNavigate('/note') },
    { icon: '🧫', name: '모아 실험', active: activePage === 'moa', badge: '', onClick: () => onNavigate('/') },
    { icon: '📰', name: '랩북 피드', active: false, badge: '11', onClick: undefined },
  ]},
  { label: '커뮤니티', items: [{ icon: '🌐', name: '커뮤니티', active: false, badge: '', onClick: undefined }] },
]

export default function App() {
  const [view, setView] = useState<View>('list')
  const [activeCard, setActiveCard] = useState<MoaCard | null>(null)
  const [cards, setCards] = useState<MoaCard[]>([])
  const [cardsLoading, setCardsLoading] = useState(true)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // 카드 목록 로딩 (Supabase)
  const loadCards = () => {
    setCardsLoading(true)
    fetchCards()
      .then(setCards)
      .catch(err => { console.error('[App] fetchCards 실패:', err); setCards([]) })
      .finally(() => setCardsLoading(false))
  }

  useEffect(() => { loadCards() }, [])

  const goDetail = (card: MoaCard) => {
    setActiveCard(card)
    setView('detail')
  }

  const goList = () => {
    setView('list')
    setActiveCard(null)
    if (SUPABASE_READY) loadCards() // 저장 후 카드 요약(yield 등) 갱신
  }

  const sections = SNB_SECTIONS('moa', navigate)

  /* ── 공통: 로고 블록 ── */
  const logo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 500, fontSize: '15px', color: 'var(--tx, #111)' }}>
      <div style={{ width: '28px', height: '28px', background: 'var(--blue, #2563eb)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="5.5" stroke="white" strokeWidth="1.4"/>
          <path d="M4.5 7.5h6M7.5 4.5v6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </div>
      Jinu<span style={{ color: 'var(--blue, #2563eb)' }}>note</span>
    </div>
  )

  /* ── 공통: 아바타 ── */
  const avatar = (
    <div style={{
      width: '30px', height: '30px', borderRadius: '50%',
      background: 'var(--blue-bg, #eff6ff)', color: 'var(--blue, #2563eb)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '11px', fontWeight: 500, cursor: 'pointer',
    }}>제</div>
  )

  /* ══════════════════════════════════════════
     모바일 레이아웃
  ══════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        {/* 모바일 GNB */}
        <header style={{
          height: '44px', flexShrink: 0,
          background: 'var(--surface, #fff)', borderBottom: '1px solid var(--border, #e5e7eb)',
          display: 'flex', alignItems: 'center', padding: '0 14px', gap: '10px', zIndex: 100,
        }}>
          {logo}
          {view === 'detail' && activeCard && (
            <span style={{ fontSize: '11px', color: 'var(--tx3, #9ca3af)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
              {activeCard.title}
            </span>
          )}
          <div style={{ marginLeft: 'auto' }}>{avatar}</div>
        </header>

        {/* 메인 영역 */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {view === 'list' ? (
            <MoaListPage
              cards={cards}
              loading={cardsLoading}
              onOpen={goDetail}
              onCardsChange={setCards}
              isMobile
            />
          ) : (
            <MoaDetailPage card={activeCard!} onBack={goList} isMobile />
          )}
        </div>

        {/* 모바일 하단 네비게이션 */}
        <nav style={{
          height: '54px', flexShrink: 0,
          background: 'var(--surface, #fff)', borderTop: '1px solid var(--border, #e5e7eb)',
          display: 'flex', alignItems: 'stretch', zIndex: 100,
        }}>
          {[
            { icon: '🧫', label: '모아실험', active: true, onClick: undefined },
            { icon: '🧪', label: '시약장',   active: false, onClick: () => navigate('/reagent') },
            { icon: '📓', label: '연구노트', active: false, onClick: () => navigate('/note') },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '2px', background: 'none', border: 'none', cursor: item.onClick ? 'pointer' : 'default',
                color: item.active ? 'var(--blue, #2563eb)' : 'var(--tx3, #9ca3af)',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    )
  }

  /* ══════════════════════════════════════════
     데스크톱 레이아웃 (기존)
  ══════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* TOPBAR */}
      <header style={{
        height: '48px', flexShrink: 0,
        background: 'var(--surface, #fff)', borderBottom: '1px solid var(--border, #e5e7eb)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', zIndex: 100,
      }}>
        {logo}
        <div style={{ fontSize: '12px', color: 'var(--tx3, #9ca3af)' }}>
          {view === 'list' ? '홈 / 모아 실험' : `홈 / 모아 실험 / ${activeCard?.title ?? ''}`}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted, #6b7280)' }}>제</span>
          {avatar}
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SNB */}
        <nav aria-label="서비스 메뉴" style={{
          width: '200px', flexShrink: 0,
          background: 'var(--surface, #fff)', borderRight: '1px solid var(--border, #e5e7eb)',
          overflowY: 'auto', padding: '10px 0 20px',
        }}>
          {sections.map((section) => (
            <div key={section.label} style={{ padding: '14px 10px 4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--hint, #9ca3af)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 8px', marginBottom: '4px' }}>
                {section.label}
              </div>
              {section.items.map((item) => (
                <div
                  key={item.name}
                  onClick={item.onClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '7px 8px', borderRadius: '6px',
                    fontSize: '12px',
                    color: item.active ? 'var(--blue, #2563eb)' : 'var(--muted, #6b7280)',
                    background: item.active ? 'var(--blue-bg, #eff6ff)' : 'transparent',
                    fontWeight: item.active ? 500 : 400,
                    cursor: item.onClick ? 'pointer' : 'default',
                    transition: 'background .12s, color .12s',
                  }}
                >
                  <span style={{ width: '16px', textAlign: 'center', fontSize: '13px' }}>{item.icon}</span>
                  {item.name}
                  {item.badge && (
                    <span style={{ marginLeft: 'auto', fontSize: '9px', background: 'var(--blue, #2563eb)', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {view === 'list' ? (
            <MoaListPage
              cards={cards}
              loading={cardsLoading}
              onOpen={goDetail}
              onCardsChange={setCards}
            />
          ) : (
            <MoaDetailPage card={activeCard!} onBack={goList} />
          )}
        </div>
      </div>
    </div>
  )
}
