import React, { useState } from 'react'
import type { HistEntry } from './index'

interface Props {
  history: HistEntry[]
  style?: React.CSSProperties
}

const TYPE_COLORS: Record<HistEntry['type'], string> = {
  create: '#1a6bb5',
  edit: '#b07d00',
  sign: '#1D9E75',
}
const TYPE_LABELS: Record<HistEntry['type'], string> = {
  create: '생성',
  edit: '수정',
  sign: '서명',
}
const TYPE_TAG_CLASS: Record<HistEntry['type'], string> = {
  create: 'htag-create',
  edit: 'htag-edit',
  sign: 'htag-sign',
}

export default function HistoryCard({ history, style }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <div className="hist-card" style={style}>
      <div className="hist-hd" onClick={() => setOpen(p => !p)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ct">변경이력</span>
          <span style={{ fontSize: 9, background: 'var(--bg2)', padding: '1px 7px', borderRadius: 8, fontWeight: 500, color: 'var(--tx2)' }}>{history.length}</span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--tx3)' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div className="hist-list">
          {history.length === 0 && <div style={{ fontSize: 10, color: 'var(--tx3)' }}>이력 없음</div>}
          {history.map((h, i) => (
            <div className="hist-item" key={i}>
              <div className="hist-dot" style={{ background: TYPE_COLORS[h.type] }} />
              <div>
                <div className="hist-meta">
                  {h.at} · {h.actor}
                  <span className={`hist-tag ${TYPE_TAG_CLASS[h.type]}`}>{TYPE_LABELS[h.type]}</span>
                </div>
                <div className="hist-desc">{h.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
