import React from 'react'
import type { Exp } from '../../types/moa'
import type { ResRow } from './index'
import { BARS } from '../../utils/moa'

interface Props {
  exp: Exp[]
  resRows: ResRow[]
  dashNote: { text: string; imgs: { name: string; dataUrl: string }[] }
  setDashNote: React.Dispatch<React.SetStateAction<{ text: string; imgs: { name: string; dataUrl: string }[] }>>
}

export default function DashboardCard({ exp, resRows, dashNote, setDashNote }: Props) {
  const calcYield = (inputMg: string, outputMg: string) => {
    const i = parseFloat(inputMg), o = parseFloat(outputMg)
    if (isNaN(i) || i <= 0 || isNaN(o) || o <= 0) return null
    return parseFloat((o / i * 100).toFixed(1))
  }

  const yields = resRows.map(r => calcYield(r.inputMg, r.outputMg))
  const validYields = yields.filter((v): v is number => v !== null)
  const total = exp.length
  const completed = validYields.length
  const bestIdx = yields.reduce<number>((best, v, i) => v !== null && (best === -1 || v > (yields[best] ?? 0)) ? i : best, -1)
  const best = bestIdx >= 0 ? yields[bestIdx] ?? null : null
  const avg = validYields.length ? (validYields.reduce((a, b) => a + b, 0) / validYields.length).toFixed(1) : null

  const maxYield = Math.max(...validYields, 1)

  const addNoteFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    Array.from(e.target.files).forEach(f => {
      const r = new FileReader()
      r.onload = ev => setDashNote(prev => ({ ...prev, imgs: [...prev.imgs, { name: f.name, dataUrl: ev.target?.result as string }] }))
      r.readAsDataURL(f)
    })
    e.target.value = ''
  }

  const removeNoteImg = (i: number) => setDashNote(prev => ({ ...prev, imgs: prev.imgs.filter((_, j) => j !== i) }))

  const rowHeight = 32 // px — matches dash-td padding

  return (
    <div className="card" id="dashboard-card">
      <div className="ch"><span className="ct">실험 대시보드</span></div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          <KpiCard label="총 실험 수" value={total} />
          <KpiCard label="완료된 실험" value={completed} sub={`${total - completed}개 미완료`} />
          <KpiCard label="최고 Yield" value={best !== null ? `${best}%` : '—'} sub={best !== null && bestIdx >= 0 ? exp[bestIdx]?.id : undefined} color="var(--green)" />
          <KpiCard label="평균 Yield" value={avg !== null ? `${avg}%` : '—'} sub="완료 기준" />
        </div>

        {/* Table + Bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {/* Table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>변수시약 vs 결과</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="dash-th">실험번호</th>
                  <th className="dash-th">변수시약 E</th>
                  <th className="dash-th">Yield%</th>
                  <th className="dash-th">수득량(mg)</th>
                </tr>
              </thead>
              <tbody>
                {resRows.map((row, ri) => {
                  const yld = calcYield(row.inputMg, row.outputMg)
                  const isBest = ri === bestIdx && yld !== null
                  return (
                    <tr key={ri} style={{ background: isBest ? '#f0fbf5' : undefined, opacity: yld === null ? .5 : 1 }}>
                      <td className="dash-td" style={{ height: rowHeight }}>{exp[ri]?.id ?? `HCE-${ri+1}`}</td>
                      <td className="dash-td" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp[ri]?.name || '—'}</td>
                      <td className="dash-td" style={{ fontWeight: isBest ? 600 : 400, color: isBest ? 'var(--green)' : undefined }}>{yld !== null ? `${yld}%` : '—'}</td>
                      <td className="dash-td">{row.outputMg || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Bar chart — same row height */}
          <div style={{ width: 220, flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '5px 8px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bd2)', height: 37, display: 'flex', alignItems: 'center' }}>Yield 비교</div>
            {resRows.map((row, ri) => {
              const yld = calcYield(row.inputMg, row.outputMg)
              const isBest = ri === bestIdx && yld !== null
              const pct = yld !== null ? Math.round(yld / maxYield * 100) : 0
              const color = isBest ? BARS[ri % BARS.length] : (yld !== null ? '#c8d0dc' : 'transparent')
              return (
                <div className="dash-bar-row" key={ri} style={{ height: rowHeight }}>
                  <div className="dash-bar-lbl">{exp[ri]?.id ?? `HCE-${ri+1}`}</div>
                  <div className="dash-bar-track">
                    <div className="dash-bar-fill" style={{ width: `${pct}%`, background: color, border: yld === null ? '1px dashed #ccc' : 'none', height: '100%' }} />
                  </div>
                  <div className="dash-bar-val" style={{ color: isBest ? 'var(--green)' : '#999' }}>
                    {yld !== null ? `${yld}%` : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Note */}
        <div style={{ borderTop: '0.5px solid var(--bd)', paddingTop: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>노트</div>
          {dashNote.imgs.length > 0 && (
            <div className="dash-note-imgs">
              {dashNote.imgs.map((img, i) => (
                <div className="dash-note-img" key={i}>
                  <img src={img.dataUrl} alt={img.name} />
                  <div className="dash-note-img-x" onClick={() => removeNoteImg(i)}>×</div>
                </div>
              ))}
            </div>
          )}
          <textarea
            className="dash-note-ta"
            placeholder="의견, 관찰 사항, 다음 실험 방향 등을 자유롭게 작성하세요..."
            value={dashNote.text}
            onChange={e => setDashNote(p => ({ ...p, text: e.target.value }))}
          />
          <div style={{ marginTop: 6 }}>
            <label className="dash-note-file">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              이미지 첨부
              <input type="file" accept="image/*" multiple onChange={addNoteFiles} />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="dash-kpi">
      <div className="dash-kpi-l">{label}</div>
      <div className="dash-kpi-v" style={{ color: color ?? 'var(--tx)' }}>{value}</div>
      {sub && <div className="dash-kpi-sub">{sub}</div>}
    </div>
  )
}
