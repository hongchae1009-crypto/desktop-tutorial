import React from 'react'
import type { Exp, Com, BaseTarget } from '../../types/moa'
import { getBaseMmol, autoMmol, calcWeight, getDeviation, eCs, cCs, cp, SAMPLE_REAGENTS } from '../../utils/moa'

interface Props {
  exp: Exp[]
  com: Com[]
  baseTarget: BaseTarget
  refOn: boolean
  onExpChange: (exp: Exp[]) => void
  onComChange: (com: Com[]) => void
  onBaseChange: (b: BaseTarget) => void
  onRefChange: (on: boolean) => void
}

export default function QuantTable({ exp, com, baseTarget, refOn, onExpChange, onComChange, onBaseChange, onRefChange }: Props) {
  const N = exp.length
  const ec = eCs(refOn)
  const cc = cCs(refOn)

  const isBaseE = baseTarget === 'exp'
  const isBaseCom = (ci: number) => baseTarget === `com-${ci}`

  const getBaseMmolV = (ri: number) => getBaseMmol(ri, baseTarget, exp, com)

  const updateExp = (ri: number, field: keyof Exp, val: string | number) => {
    const next = exp.map((e, i) => i === ri ? { ...e, [field]: val } : e)
    onExpChange(next)
  }
  const updateCom = (ci: number, field: keyof Com, val: string | number) => {
    const next = com.map((c, i) => i === ci ? { ...c, [field]: val } : c)
    onComChange(next)
  }
  const updateComCell = (ci: number, ri: number, val: string) => {
    const next = com.map((c, i) => i === ci ? {
      ...c,
      cells: c.cells.map((cell, j) => j === ri ? { ...cell, m: val } : cell)
    } : c)
    onComChange(next)
  }

  const addRow = () => {
    const n = exp.length + 1
    onExpChange([...exp, { id: `HCE-${n}`, name: '', pin: '', mw: null, eq: 1, baseMmol: '', m: '' }])
    onComChange(com.map(c => ({ ...c, cells: [...c.cells, { m: '' }] })))
  }

  const delRow = (ri: number) => {
    if (exp.length <= 1) return
    onExpChange(exp.filter((_, i) => i !== ri))
    onComChange(com.map(c => ({ ...c, cells: c.cells.filter((_, i) => i !== ri) })))
  }

  const addComCol = () => {
    const ci = com.length
    onComChange([...com, { name: `Compound ${String.fromCharCode(65 + ci)}`, pin: '', mw: null, eq: 1, baseMmol: '', cells: exp.map(() => ({ m: '' })) }])
  }

  const delComCol = (ci: number) => {
    onComChange(com.filter((_, i) => i !== ci))
  }

  return (
    <div className="card" style={{ overflow: 'visible' }}>
      <div className="ch">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="ct">시작물질/반응물</span>
          <span style={{ fontSize: 9, color: '#999', fontStyle: 'italic' }}>
            ⭐기준물질 선택 (1개) 후 mmol 입력, 다른 물질은 eq 기준 mmol·weight(mg) 자동계산됨. 오차&nbsp;
            <span style={{ color: 'var(--org)' }}>■</span>±5~10%&nbsp;
            <span style={{ color: 'var(--red)' }}>■</span>&gt;10%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <button className="btn btn-b" onClick={addRow}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#1a6bb5" strokeWidth="1.4"/><path d="M8 5v6M5 8h6" stroke="#1a6bb5" strokeWidth="1.5" strokeLinecap="round"/></svg>
            실험 추가
          </button>
          <button className="btn btn-g" onClick={addComCol}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#1D9E75" strokeWidth="1.4"/><path d="M8 5v6M5 8h6" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/></svg>
            공통시약 추가
          </button>
          <div style={{ width: 1, height: 15, background: 'var(--bd)' }} />
          <span style={{ fontSize: 9, color: 'var(--tx2)' }}>참고값</span>
          <label className="tgl">
            <input type="checkbox" checked={refOn} onChange={e => onRefChange(e.target.checked)} />
            <span className="tgls" />
          </label>
        </div>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            {/* 1단 헤더 */}
            <tr>
              <th rowSpan={2} style={{ padding: '5px 8px', background: 'var(--bg2)', fontWeight: 500, fontSize: 9, color: 'var(--tx3)' }}>실험번호</th>
              {/* E — rowspan=2 merged */}
              <th rowSpan={2} colSpan={1} style={{ padding: '5px 10px', background: '#fef5e4', borderLeft: '2px solid #EF9F27', minWidth: 130 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <input type="radio" className="base-radio" name="base-e" checked={isBaseE} onChange={() => onBaseChange('exp')} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 500 }}>변수시약</div>
                    <div style={{ fontSize: 8, color: '#bbb', fontFamily: 'var(--fm)' }}>PIN · MW</div>
                  </div>
                  {isBaseE && <span style={{ fontSize: 8, background: 'var(--org-bg)', color: '#633806', border: '0.5px solid var(--org-bd)', borderRadius: 3, padding: '1px 4px' }}>기준</span>}
                </div>
              </th>
              {/* E colspan group */}
              <th colSpan={ec} style={{ padding: '5px 8px', background: '#fef5e4', textAlign: 'center', fontSize: 9, color: '#8a4f00', fontWeight: 500 }}>변수시약</th>
              {/* COM groups */}
              {com.map((c, ci) => {
                const pl = cp(ci)
                return (
                  <th key={ci} colSpan={cc} style={{ padding: '4px 8px', background: pl.hBg, borderLeft: `2.5px solid ${pl.bl}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="radio" className="base-radio" name={`base-com-${ci}`} checked={isBaseCom(ci)} onChange={() => onBaseChange(`com-${ci}`)} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 500, color: pl.hC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || '시약명'}</div>
                        <div style={{ fontSize: 8, color: '#bbb', fontFamily: 'var(--fm)' }}>{c.pin} · MW {c.mw ?? '—'}</div>
                      </div>
                      {isBaseCom(ci) && <span style={{ fontSize: 8, background: pl.hBg, color: pl.hC, border: `0.5px solid ${pl.bl}`, borderRadius: 3, padding: '1px 4px' }}>기준</span>}
                      <button className="del-col-btn" onClick={() => delComCol(ci)} title="열 삭제">×</button>
                    </div>
                  </th>
                )
              })}
            </tr>
            {/* 2단 헤더 */}
            <tr>
              {refOn && <th style={{ padding: '4px 6px', background: '#fef5e4', fontSize: 9, color: '#8a4f00', fontWeight: 400, textAlign: 'center' }}>eq</th>}
              {refOn && <th style={{ padding: '4px 6px', background: '#fef5e4', fontSize: 9, color: '#8a4f00', fontWeight: 400, textAlign: 'center' }}>mmol</th>}
              <th style={{ padding: '4px 6px', background: '#fef5e4', fontSize: 9, color: '#8a4f00', fontWeight: 400, textAlign: 'center' }}>weight</th>
              <th style={{ padding: '4px 6px', background: '#fef5e4', fontSize: 9, color: '#8a4f00', fontWeight: 400, textAlign: 'center' }}>실측(mg)</th>
              {com.map((_, ci) => {
                const pl = cp(ci)
                return (
                  <React.Fragment key={ci}>
                    {refOn && <th style={{ padding: '4px 6px', background: pl.hBg, fontSize: 9, color: pl.hC, fontWeight: 400, textAlign: 'center', borderLeft: `2.5px solid ${pl.bl}` }}>eq</th>}
                    {refOn && <th style={{ padding: '4px 6px', background: pl.hBg, fontSize: 9, color: pl.hC, fontWeight: 400, textAlign: 'center' }}>mmol</th>}
                    <th style={{ padding: '4px 6px', background: pl.hBg, fontSize: 9, color: pl.hC, fontWeight: 400, textAlign: 'center', ...(!refOn ? { borderLeft: `2.5px solid ${pl.bl}` } : {}) }}>weight</th>
                    <th style={{ padding: '4px 6px', background: pl.hBg, fontSize: 9, color: pl.hC, fontWeight: 400, textAlign: 'center' }}>실측(mg)</th>
                  </React.Fragment>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {exp.map((e, ri) => {
              const baseMmol = getBaseMmolV(ri)
              // E calc
              const eMmol = isBaseE ? (parseFloat(e.baseMmol) || null) : autoMmol(baseMmol, e.eq)
              const eWeight = calcWeight(eMmol, e.mw)
              const eDev = getDeviation(eWeight, e.m)

              return (
                <tr key={ri}>
                  {/* ID */}
                  <td className="id-cell">
                    <input className="inp inp-id" value={e.id} onChange={ev => updateExp(ri, 'id', ev.target.value)} />
                    <button className="del-row-btn" onClick={() => delRow(ri)}>×</button>
                  </td>
                  {/* E name */}
                  <td style={{ padding: '4px 8px', background: '#fef5e4', borderLeft: '2px solid #EF9F27', minWidth: 130 }}>
                    <div className="rcell">
                      <div className="rname-wrap">
                        <span className={`rname${!e.name ? ' empty' : ''}`}>{e.name || '시약명 없음'}</span>
                        <span className="rsub">{e.pin} · MW {e.mw ?? '—'}</span>
                      </div>
                      <button className="sbtn" title="시약 검색">🔍</button>
                    </div>
                  </td>
                  {/* E eq/mmol/weight/measure */}
                  {refOn && (
                    <td style={{ padding: '3px 5px', background: '#fef5e4' }}>
                      {isBaseE ? <span className="eq1">1.00</span> : <input className="inp inp-eq" value={e.eq} onChange={ev => updateExp(ri, 'eq', Number(ev.target.value))} />}
                    </td>
                  )}
                  {refOn && (
                    <td style={{ padding: '3px 5px', background: '#fef5e4' }}>
                      {isBaseE
                        ? <input className="inp inp-mmol" value={e.baseMmol} onChange={ev => updateExp(ri, 'baseMmol', ev.target.value)} placeholder="0.000" />
                        : <span className={`mmol-auto${eMmol ? ' has' : ''}`}>{eMmol ?? '—'}</span>
                      }
                    </td>
                  )}
                  <td style={{ padding: '3px 5px', background: '#fef5e4', ...(!refOn ? { borderLeft: '2px solid #EF9F27' } : {}) }}>
                    {isBaseE && !refOn
                      ? <input className="inp inp-mmol" value={e.baseMmol} onChange={ev => updateExp(ri, 'baseMmol', ev.target.value)} placeholder="mmol" />
                      : <span className={`mmol-auto${eWeight ? ' has' : ''}`}>{eWeight ? `${eWeight} mg` : '—'}</span>
                    }
                  </td>
                  <td style={{ padding: '3px 5px', background: eDev?.cellBg || '#fef5e4' }}>
                    <input className="inp inp-k" value={e.m} onChange={ev => updateExp(ri, 'm', ev.target.value)} placeholder="0.00" />
                    {eDev && <span className={`d${eDev.badge}`}>{eDev.label}</span>}
                  </td>
                  {/* COM cells */}
                  {com.map((c, ci) => {
                    const pl = cp(ci)
                    const isBCom = isBaseCom(ci)
                    const cMmol = isBCom ? (parseFloat(c.baseMmol) || null) : autoMmol(baseMmol, c.eq)
                    const cWeight = calcWeight(cMmol, c.mw)
                    const cDev = getDeviation(cWeight, c.cells[ri]?.m ?? '')
                    return (
                      <React.Fragment key={ci}>
                        {refOn && (
                          <td style={{ padding: '3px 5px', background: pl.kBg, borderLeft: `2.5px solid ${pl.bl}` }}>
                            {isBCom ? <span className="eq1">1.00</span> : <input className="inp inp-eq" value={c.eq} onChange={ev => updateCom(ci, 'eq', Number(ev.target.value))} />}
                          </td>
                        )}
                        {refOn && (
                          <td style={{ padding: '3px 5px', background: pl.kBg }}>
                            {isBCom
                              ? <input className="inp inp-mmol" value={c.baseMmol} onChange={ev => updateCom(ci, 'baseMmol', ev.target.value)} placeholder="0.000" />
                              : <span className={`mmol-auto${cMmol ? ' has' : ''}`}>{cMmol ?? '—'}</span>
                            }
                          </td>
                        )}
                        <td style={{ padding: '3px 5px', background: pl.kBg, ...(!refOn ? { borderLeft: `2.5px solid ${pl.bl}` } : {}) }}>
                          {isBCom && !refOn
                            ? <input className="inp inp-mmol" value={c.baseMmol} onChange={ev => updateCom(ci, 'baseMmol', ev.target.value)} placeholder="mmol" />
                            : <span className={`mmol-auto${cWeight ? ' has' : ''}`}>{cWeight ? `${cWeight} mg` : '—'}</span>
                          }
                        </td>
                        <td style={{ padding: '3px 5px', background: cDev?.cellBg || pl.dBg }}>
                          <input className="inp inp-k" value={c.cells[ri]?.m ?? ''} onChange={ev => updateComCell(ci, ri, ev.target.value)} placeholder="0.00" />
                          {cDev && <span className={`d${cDev.badge}`}>{cDev.label}</span>}
                        </td>
                      </React.Fragment>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
