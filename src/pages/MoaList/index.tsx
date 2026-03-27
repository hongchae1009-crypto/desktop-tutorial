import React, { useState } from 'react'
import type { MoaCard, MoaStatus } from '../../types/moa'
import { SAMPLE_FOLDERS } from '../../data/sample'
import { BARS } from '../../utils/moa'
import { generateCardId, createCard, deleteCard, fetchCards } from '../../services/moaService'
import { SUPABASE_READY } from '../../utils/supabase'

interface Props {
  cards: MoaCard[]
  loading?: boolean
  onOpen: (card: MoaCard) => void
  onCardsChange: (cards: MoaCard[]) => void
}

type Folder = { name: string }

const STATUS_LABELS: Record<MoaStatus, string> = { draft: '초안', active: '진행 중', done: '완료' }

export default function MoaListPage({ cards, loading, onOpen, onCardsChange }: Props) {
  const [folders, setFolders] = useState<Folder[]>(SAMPLE_FOLDERS)
  const [activeFolder, setActiveFolder] = useState('전체')
  const [statusFilter, setStatusFilter] = useState<'all' | MoaStatus>('all')
  const [search, setSearch] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  // 새 실험 생성 모달 상태
  const [newModal, setNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newProject, setNewProject] = useState('')
  const [creating, setCreating] = useState(false)

  // 삭제 확인 상태
  const [deleteTarget, setDeleteTarget] = useState<MoaCard | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 새 카드 생성
  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return
    setCreating(true)
    try {
      const id = await generateCardId()
      const newCard: MoaCard = {
        id,
        title,
        project: newProject.trim() || (activeFolder !== '전체' ? activeFolder : ''),
        status: 'active',
        expCount: 0,
        bestYield: null,
        yieldHistory: [],
        author: '제은',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      await createCard(newCard)
      // Supabase 연결 시 DB에서 최신 목록 조회, 미연결 시 로컬 목록에 추가
      const updated = SUPABASE_READY ? await fetchCards() : [...cards, newCard]
      onCardsChange(updated)
      setNewModal(false)
      setNewTitle('')
      setNewProject('')
      onOpen(newCard)
    } catch (e) {
      console.error('카드 생성 실패:', e)
      alert('카드 생성에 실패했습니다.')
    } finally {
      setCreating(false)
    }
  }

  // 카드 삭제
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCard(deleteTarget.id)
      const updated = SUPABASE_READY ? await fetchCards() : cards.filter(c => c.id !== deleteTarget.id)
      onCardsChange(updated)
      setDeleteTarget(null)
    } catch (e) {
      console.error('카드 삭제 실패:', e)
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

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
    const key = c.project || '기타'
    if (!cardsByFolder[key]) cardsByFolder[key] = []
    cardsByFolder[key].push(c)
  })
  if (activeFolder === '전체') {
    folderOrder.forEach(fn => {
      if (cardsByFolder[fn]?.length) grouped.push({ folder: fn, items: cardsByFolder[fn] })
    })
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
  cards.forEach(c => { counts[c.project || '기타'] = (counts[c.project || '기타'] || 0) + 1 })

  return (
    <>
      {/* Button bar */}
      <div className="btnbar">
        <button className="btn btn-p" onClick={() => { setNewTitle(''); setNewProject(''); setNewModal(true) }}>
          + 새 모아 실험
        </button>
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

          {/* Loading */}
          {loading && (
            <div style={{ color: 'var(--tx3)', fontSize: 11, padding: '20px 0' }}>
              데이터 로딩 중…
            </div>
          )}

          {/* Card groups */}
          {!loading && grouped.length === 0 && (
            <div style={{ color: 'var(--tx3)', fontSize: 11, padding: '20px 0' }}>
              {cards.length === 0 ? '+ 새 모아 실험 버튼으로 첫 번째 실험을 만들어 보세요.' : '해당 조건의 실험이 없습니다.'}
            </div>
          )}
          {!loading && grouped.map(({ folder, items }) => (
            <div key={folder}>
              <div className="folder-group-hd">
                <span>📁 {folder}</span>
                <span style={{ fontSize: 9, color: 'var(--tx3)' }}>{items.length}건</span>
              </div>
              <div className="list-grid">
                {items.map(card => (
                  <MoaCardItem
                    key={card.id}
                    card={card}
                    onClick={() => onOpen(card)}
                    onDelete={() => setDeleteTarget(card)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 새 실험 생성 모달 */}
      {newModal && (
        <div className="confirm-toast">
          <div className="confirm-box" style={{ width: 320 }}>
            <div style={{ fontWeight: 500, marginBottom: 12, fontSize: 13 }}>새 모아 실험 만들기</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--tx3)', marginBottom: 3 }}>실험명 *</div>
                <input
                  className="mi-inp"
                  style={{ width: '100%' }}
                  placeholder="예: HCE-260327"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>
              <div>
                <div style={{ fontSize: 9, color: 'var(--tx3)', marginBottom: 3 }}>프로젝트</div>
                <input
                  className="mi-inp"
                  style={{ width: '100%' }}
                  placeholder="예: 2026 Piperazine"
                  value={newProject}
                  onChange={e => setNewProject(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button className="btn" onClick={() => setNewModal(false)}>취소</button>
              <button
                className="btn btn-p"
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                style={{ opacity: creating ? 0.6 : 1 }}
              >
                {creating ? '생성 중…' : '만들기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="confirm-toast">
          <div className="confirm-box">
            <div style={{ fontWeight: 500, marginBottom: 8 }}>실험을 삭제하시겠습니까?</div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 16, lineHeight: 1.7 }}>
              <strong>{deleteTarget.title}</strong> ({deleteTarget.id})<br/>
              삭제 후에는 복구할 수 없습니다.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button className="btn" onClick={() => setDeleteTarget(null)}>취소</button>
              <button
                className="btn btn-d"
                onClick={handleDelete}
                disabled={deleting}
                style={{ opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MoaCardItem({ card, onClick, onDelete }: { card: MoaCard; onClick: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false)
  const max = Math.max(...card.yieldHistory.map(h => h.yield ?? 0), 1)
  return (
    <div
      className="mcard"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative' }}
    >
      {/* 삭제 버튼 (hover 시 표시) */}
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            position: 'absolute', top: 6, right: 6,
            width: 20, height: 20, borderRadius: '50%',
            background: '#fee2e2', border: 'none', cursor: 'pointer',
            fontSize: 10, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1,
          }}
          title="삭제"
        >✕</button>
      )}
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
