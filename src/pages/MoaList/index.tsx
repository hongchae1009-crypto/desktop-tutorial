import React, { useState, useRef } from 'react'
import type { MoaCard, MoaStatus } from '../../types/moa'
import { SAMPLE_FOLDERS } from '../../data/sample'
import { BARS } from '../../utils/moa'

interface Props {
  cards: MoaCard[]
  onOpen: (card: MoaCard) => void
}

type Folder = { name: string }

const STATUS_LABELS: Record<MoaStatus, string> = { draft: '초안', active: '진행 중', done: '완료' }

export default function MoaListPage({ cards, onOpen }: Props) {
  const [folders, setFolders] = useState<Folder[]>(SAMPLE_FOLDERS)
  const [activeFolder, setActiveFolder] = useState('전체')
  const [statusFilter, setStatusFilter] = useState<'all' | MoaStatus>('all')
  const [search, setSearch] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  // filtering
  const filtered = cards.filter(c => {
    if (activeFolder !== '전체' && c.project !== activeFolder) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    const q = search.toLowerCase()
    if (q && !c.title.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false
    return true
  })

  // group by folder
  const folderOrder = folders.filter(f => f.name !== '전체').map(f => f.name)
  const grouped: { folder: string; items: MoaCard[] }[] = []
  const cardsByFolder: Record<string, MoaCard[]> = {}
  filtered.forEach(c => {
    if (!cardsByFolder[c.project]) cardsByFolder[c.project] = []
    cardsByFolder[c.project].push(c)
  })
  if (activeFolder === '전체') {
    folderOrder.forEach(fn => {
      if (cardsByFolder[fn]?.length) grouped.push({ folder: fn, items: cardsByFolder[fn] })
    })
    // catch-all for unlisted folders
    Object.entries(cardsByFolder).forEach(([fn, items]) => {
      if (!folderOrder.includes(fn)) grouped.push({ folder: fn, items })
    })
  } else {
    if (cardsByFolder[activeFolder]?.length) {
      grouped.push({ folder: activeFolder, items: cardsByFolder[activeFolder] })
    }
  }

  // drag handlers
  const onDragStart = (i: number) => setDragIdx(i)
  const onDragOver = (e: React.DragEvent, i: number) => {
    if (dragIdx === null || dragIdx === i) return
    e.preventDefault()
    setOverIdx(i)
  }
  const onDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) return
    const next = [...folders]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    setFolders(next)
    setDragIdx(null)
    setOverIdx(null)
  }
  const onDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  const counts: Record<string, number> = {}
  cards.forEach(c => { counts[c.project] = (counts[c.project] || 0) + 1 })

  return (
    <>
      {/* Button bar */}
      <div className="btnbar">
        <button className="btn btn-p" onClick={() => onOpen(cards[0])}>+ 새 모아 실험</button>
      </div>

      {/* Metabar */}
      <div className="metabar">
        <div className="mi"><span className="ml">연구노트</span><span className="mv">모아 실험 목록</span></div>
        <div className="mi"><span className="ml">프로젝트</span><span className="mv">2026 Piperazine</span></div>
        <div className="mi"><span className="ml">총 실험</span><span className="mv">{cards.length}건</span></div>
      </div>

      {/* Content */}
      <div className="list-wrap">
        {/* Header */}
        <div className="list-hd">
          <h2 style={{ fontSize: 14, fontWeight: 600 }}>모아 실험 목록</h2>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              style={{ padding: '5px 10px', border: '0.5px solid var(--bd2)', borderRadius: 5, fontSize: 11, background: 'var(--bg2)', color: 'var(--tx)', width: 210, outline: 'none', fontFamily: 'var(--f)' }}
              placeholder="실험명 또는 번호 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {(['all', 'active', 'done'] as const).map(s => (
              <button
                key={s}
                className="btn"
                style={statusFilter === s ? { background: 'var(--blue-bg)', borderColor: 'var(--blue-bd)', color: 'var(--blue)' } : {}}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? '전체' : s === 'active' ? '진행 중' : '완료'}
              </button>
            ))}
          </div>
        </div>

        <div className="list-body">
          {/* Folder icons */}
          <div className="folder-bar">
            <div className="folder-icons">
              {folders.map((f, i) => (
                <div
                  key={f.name}
                  className={`folder-ico${activeFolder === f.name ? ' fi-active' : ''}${dragIdx === i ? ' fi-dragging' : ''}${overIdx === i && dragIdx !== i ? ' fi-over' : ''}`}
                  draggable
                  onClick={() => setActiveFolder(f.name)}
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDrop={() => onDrop(i)}
                  onDragEnd={onDragEnd}
                >
                  <div className="folder-ico-img">{f.name === '전체' ? '🗂️' : '📁'}</div>
                  <div className="folder-ico-name">{f.name === '전체' ? '전체 보기' : f.name}</div>
                  <div className="folder-ico-cnt">{f.name === '전체' ? cards.length : counts[f.name] ?? 0}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card groups */}
          {grouped.length === 0 && (
            <div style={{ color: 'var(--tx3)', fontSize: 11, padding: '20px 0' }}>해당 조건의 실험이 없습니다.</div>
          )}
          {grouped.map(({ folder, items }) => (
            <div key={folder}>
              <div className="folder-group-hd">
                <span>📁 {folder}</span>
                <span style={{ fontSize: 9, color: 'var(--tx3)' }}>{items.length}건</span>
              </div>
              <div className="list-grid">
                {items.map(card => <MoaCardItem key={card.id} card={card} onClick={() => onOpen(card)} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function MoaCardItem({ card, onClick }: { card: MoaCard; onClick: () => void }) {
  const max = Math.max(...card.yieldHistory.map(h => h.yield ?? 0), 1)
  return (
    <div className="mcard" onClick={onClick}>
      <div className="mcard-num">{card.id}</div>
      <div className="mcard-title">{card.title}</div>
      <div className="mcard-meta">
        <span className={`stag s-${card.status}`}>{STATUS_LABELS[card.status]}</span>
        <span style={{ fontSize: 9, color: 'var(--tx3)' }}>{card.project}</span>
      </div>
      <div className="mcard-stats">
        <div className="stat">
          <span className="stat-l">실험 수</span>
          <span className="stat-v">{card.expCount}</span>
        </div>
        <div className="stat">
          <span className="stat-l">최고 yield</span>
          <span className="stat-best">{card.bestYield != null ? `${card.bestYield}%` : '—'}</span>
        </div>
        <div className="mini-bars">
          {card.yieldHistory.map((h, i) => (
            <div className="mini-row" key={i}>
              <span className="mini-l">{h.id}</span>
              <div className="mini-tr">
                <div
                  className="mini-f"
                  style={{ width: h.yield != null ? `${Math.round(h.yield / max * 100)}%` : '0%', background: BARS[i % BARS.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
