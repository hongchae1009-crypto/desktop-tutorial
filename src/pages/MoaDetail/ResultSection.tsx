import React, { useState } from 'react'
import type { Exp, Com, BaseTarget } from '../../types/moa'
import type { ResRow, SideRow } from './index'

type AnalyticsKey = 'productSmiles' | 'lcmsMz' | 'nmrSolvent' | 'hplcRetention' | 'chromatographySystem' | 'rfValue'

interface Props {
  exp: Exp[]
  com: Com[]
  baseTarget: BaseTarget
  resRows: ResRow[]
  setResRows: React.Dispatch<React.SetStateAction<ResRow[]>>
  onEdit: () => void
}

let sideIdCounter = 1

export default function ResultSection({ exp, resRows, setResRows, onEdit }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleExpand = (ri: number) =>
    setExpandedRows(prev => { const s = new Set(prev); s.has(ri) ? s.delete(ri) : s.add(ri); return s })

  const updateRow = (ri: number, field: keyof ResRow, val: string) => {
    setResRows(prev => prev.map((r, i) => i === ri ? { ...r, [field]: val } : r))
    onEdit()
  }

  const addSide = (ri: number) => {
    setResRows(prev => prev.map((r, i) => i === ri ? {
      ...r, sides: [...r.sides, {
        id: sideIdCounter++,
        cpdName: '', cpdPin: '', cpdMw: '',
        inputMg: '', outputMg: '', purPct: '', meth: '', atts: []
      }]
    } : r))
  }

  const delSide = (ri: number, sid: number) => {
    setResRows(prev => prev.map((r, i) => i === ri ? { ...r, sides: r.sides.filter(s => s.id !== sid) } : r))
  }

  const updateSide = (ri: number, sid: number, field: keyof SideRow, val: string) => {
    setResRows(prev => prev.map((r, i) => i === ri ? {
      ...r, sides: r.sides.map(s => s.id === sid ? { ...s, [field]: val } : s)
    } : r))
    onEdit()
  }

  const calcYield = (inputMg: string, outputMg: string) => {
    const inp = parseFloat(inputMg), out = parseFloat(outputMg)
    if (isNaN(inp) || inp <= 0 || isNaN(out) || out <= 0) return ''
    return (out / inp * 100).toFixed(1)
  }

  const calcMmol = (outputMg: string, mwStr: string) => {
    const mg = parseFloat(outputMg), mw = parseFloat(mwStr)
    if (isNaN(mg) || mg <= 0 || isNaN(mw) || mw <= 0) return ''
    return (mg / mw).toFixed(4)
  }

  return (
    <div className="res-card">
      <div className="ch">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="ct">실험 결과</span>
          <span style={{ fontSize: 9, color: '#999', fontStyle: 'italic' }}>화합물명 → MW 연동 → 수득량 입력 시 mmol 자동계산</span>
        </div>
      </div>
      <div className="res-tbl">
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th className="rth" style={{ width: 70 }}>실험번호</th>
              <th className="rth">화합물명 / PIN · MW</th>
              <th className="rth" style={{ width: 70 }}>input(mg)</th>
              <th className="rth" style={{ width: 70 }}>output(mg)</th>
              <th className="rth" style={{ width: 64 }}>Yield%<br /><span style={{ fontWeight: 400, color: '#bbb' }}>자동</span></th>
              <th className="rth" style={{ width: 70 }}>mmol<br /><span style={{ fontWeight: 400, color: '#bbb' }}>자동</span></th>
              <th className="rth" style={{ width: 54 }}>순도%</th>
              <th className="rth" style={{ width: 72 }}>분석방법</th>
              <th className="rth" style={{ width: 80 }}>첨부파일</th>
              <th className="rth" style={{ width: 36 }}>분석</th>
            </tr>
          </thead>
          <tbody>
            {resRows.map((row, ri) => {
              const yld = calcYield(row.inputMg, row.outputMg)
              const mmol = calcMmol(row.outputMg, row.cpdMw)
              const totalYield = [yld, ...row.sides.map(s => calcYield(s.inputMg, s.outputMg))]
                .filter(v => v !== '').reduce((a, b) => (parseFloat(a) + parseFloat(b)).toFixed(1), '0')
              const hasMulti = row.sides.length > 0

              return (
                <React.Fragment key={ri}>
                  <tr className="res-main-row">
                    <td className="rtd">
                      <div style={{ fontWeight: 500 }}>{exp[ri]?.id ?? `HCE-${ri + 1}`}</div>
                      <button className="add-side-btn" onClick={() => addSide(ri)}>+ side</button>
                      {hasMulti && (
                        <div className="ysum" style={{ display: 'block' }}>
                          Σ {totalYield}%
                        </div>
                      )}
                    </td>
                    <td className="rtd">
                      <div className="cpd-cell">
                        <div>
                          <div className={`cpd-name${!row.cpdName ? ' empty' : ''}`}>{row.cpdName || '화합물명'}</div>
                          <div className="cpd-sub">{row.cpdPin} {row.cpdMw ? `· MW ${row.cpdMw}` : ''}</div>
                        </div>
                        <button className="sbtn" title="화합물 검색">🔍</button>
                      </div>
                    </td>
                    <td className="rtd"><input className="rinp" style={{ width: 58 }} value={row.inputMg} onChange={e => updateRow(ri, 'inputMg', e.target.value)} placeholder="0.00" /></td>
                    <td className="rtd"><input className="rinp" style={{ width: 58 }} value={row.outputMg} onChange={e => updateRow(ri, 'outputMg', e.target.value)} placeholder="0.00" /></td>
                    <td className="rtd" style={{ textAlign: 'center' }}>
                      <span className={`mmol-auto${yld ? ' has' : ''}`}>{yld || '—'}{yld ? '%' : ''}</span>
                    </td>
                    <td className="rtd" style={{ textAlign: 'center' }}>
                      <span className={`mmol-auto${mmol ? ' has' : ''}`}>{mmol || '—'}</span>
                    </td>
                    <td className="rtd"><input className="rinp" style={{ width: 42 }} value={row.purPct} onChange={e => updateRow(ri, 'purPct', e.target.value)} placeholder="—" /></td>
                    <td className="rtd">
                      <select className="rsel" value={row.meth} onChange={e => updateRow(ri, 'meth', e.target.value)}>
                        <option value="">—</option>
                        <option>LCMS</option><option>NMR</option><option>HPLC</option><option>GC</option>
                      </select>
                    </td>
                    <td className="rtd">
                      <AttCell files={row.atts} onAdd={files => {
                        setResRows(prev => prev.map((r, i) => i === ri ? { ...r, atts: [...r.atts, ...files] } : r))
                      }} onRemove={idx => {
                        setResRows(prev => prev.map((r, i) => i === ri ? { ...r, atts: r.atts.filter((_, j) => j !== idx) } : r))
                      }} />
                    </td>
                    <td className="rtd" style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => toggleExpand(ri)}
                        className="sbtn"
                        title="분석 데이터 입력"
                        style={{ fontSize: 11, background: expandedRows.has(ri) ? '#e8f0fa' : undefined }}
                      >
                        {expandedRows.has(ri) ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>
                  {/* 분석 데이터 확장 패널 */}
                  {expandedRows.has(ri) && (
                    <tr>
                      <td colSpan={10} style={{ background: '#f8fafd', padding: '10px 16px', borderBottom: '1px solid #e8edf5' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', alignItems: 'flex-end' }}>
                          {([
                            { key: 'productSmiles', label: '생성물 SMILES', placeholder: 'CC(=O)Oc1ccccc1...', wide: true },
                            { key: 'lcmsMz', label: 'LCMS m/z', placeholder: '324.1 [M+H]+' },
                            { key: 'nmrSolvent', label: 'NMR 용매', placeholder: 'CDCl₃' },
                            { key: 'rfValue', label: 'TLC Rf', placeholder: '0.45' },
                            { key: 'chromatographySystem', label: '컬럼 조건', placeholder: 'Hex:EA 4:1' },
                            { key: 'hplcRetention', label: 'HPLC Rt (min)', placeholder: '3.2' },
                          ] as { key: AnalyticsKey; label: string; placeholder: string; wide?: boolean }[]).map(({ key, label, placeholder, wide }) => (
                            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 9, color: 'var(--tx3)', fontWeight: 500 }}>{label}</span>
                              <input
                                className="rinp"
                                style={{ width: wide ? 240 : 110, fontSize: 11 }}
                                value={row[key] ?? ''}
                                onChange={e => {
                                  setResRows(prev => prev.map((r, i) => i === ri ? { ...r, [key]: e.target.value } : r))
                                  onEdit()
                                }}
                                placeholder={placeholder}
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {/* side rows */}
                  {row.sides.map(s => {
                    const sYld = calcYield(s.inputMg, s.outputMg)
                    const sMmol = calcMmol(s.outputMg, s.cpdMw)
                    return (
                      <tr className="res-side-row" key={s.id}>
                        <td className="rtd">
                          <div className="side-label">
                            <span style={{ fontSize: 10 }}>↳</span>
                            <span>Side</span>
                            <button className="side-del-btn" onClick={() => delSide(ri, s.id)}>×</button>
                          </div>
                        </td>
                        <td className="rtd">
                          <div className="cpd-cell">
                            <div>
                              <div className={`cpd-name${!s.cpdName ? ' empty' : ''}`}>{s.cpdName || '화합물명'}</div>
                              <div className="cpd-sub">{s.cpdPin} {s.cpdMw ? `· MW ${s.cpdMw}` : ''}</div>
                            </div>
                            <button className="sbtn">🔍</button>
                          </div>
                        </td>
                        <td className="rtd"><input className="rinp" style={{ width: 58 }} value={s.inputMg} onChange={e => updateSide(ri, s.id, 'inputMg', e.target.value)} placeholder="0.00" /></td>
                        <td className="rtd"><input className="rinp" style={{ width: 58 }} value={s.outputMg} onChange={e => updateSide(ri, s.id, 'outputMg', e.target.value)} placeholder="0.00" /></td>
                        <td className="rtd" style={{ textAlign: 'center' }}>
                          <span className={`mmol-auto${sYld ? ' has' : ''}`}>{sYld || '—'}{sYld ? '%' : ''}</span>
                        </td>
                        <td className="rtd" style={{ textAlign: 'center' }}>
                          <span className={`mmol-auto${sMmol ? ' has' : ''}`}>{sMmol || '—'}</span>
                        </td>
                        <td className="rtd"><input className="rinp" style={{ width: 42 }} value={s.purPct} onChange={e => updateSide(ri, s.id, 'purPct', e.target.value)} placeholder="—" /></td>
                        <td className="rtd">
                          <select className="rsel" value={s.meth} onChange={e => updateSide(ri, s.id, 'meth', e.target.value)}>
                            <option value="">—</option>
                            <option>LCMS</option><option>NMR</option><option>HPLC</option><option>GC</option>
                          </select>
                        </td>
                        <td className="rtd">
                          <AttCell files={s.atts} onAdd={files => {
                            setResRows(prev => prev.map((r, i) => i === ri ? {
                              ...r, sides: r.sides.map(sr => sr.id === s.id ? { ...sr, atts: [...sr.atts, ...files] } : sr)
                            } : r))
                          }} onRemove={idx => {
                            setResRows(prev => prev.map((r, i) => i === ri ? {
                              ...r, sides: r.sides.map(sr => sr.id === s.id ? { ...sr, atts: sr.atts.filter((_, j) => j !== idx) } : sr)
                            } : r))
                          }} />
                        </td>
                        <td className="rtd" />
                      </tr>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AttCell({ files, onAdd, onRemove }: {
  files: { name: string; dataUrl: string }[]
  onAdd: (f: { name: string; dataUrl: string }[]) => void
  onRemove: (i: number) => void
}) {
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    Array.from(e.target.files).forEach(f => {
      const r = new FileReader()
      r.onload = ev => onAdd([{ name: f.name, dataUrl: ev.target?.result as string }])
      r.readAsDataURL(f)
    })
    e.target.value = ''
  }
  return (
    <div className="att-wrap">
      <div className="att-files">
        {files.map((f, i) => (
          <span className="att-tag" key={i}>
            {f.dataUrl.startsWith('data:image') && <img className="att-thumb" src={f.dataUrl} alt="" />}
            <span className="att-name">{f.name}</span>
            <span className="att-x" onClick={() => onRemove(i)}>×</span>
          </span>
        ))}
        <label className="att-add">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input type="file" multiple style={{ display: 'none' }} onChange={handleFiles} />
        </label>
      </div>
    </div>
  )
}
