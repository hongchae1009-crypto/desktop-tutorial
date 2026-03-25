import React, { useState, useCallback } from 'react'
import type { MoaCard, Exp, Com, BaseTarget } from '../../types/moa'
import { getBaseMmol, autoMmol, calcWeight, getDeviation, eCs, cCs, cp, SAMPLE_REAGENTS } from '../../utils/moa'
import { copyToClipboard } from '../../utils/aiExport'
import QuantTable from './QuantTable'
import ResultSection from './ResultSection'
import DashboardCard from './DashboardCard'
import SignatureCard from './SignatureCard'
import HistoryCard from './HistoryCard'

interface Props {
  card: MoaCard
  onBack: () => void
}

// initial state
const initExp = (): Exp[] => [
  { id: 'HCE-1', name: '1-Bromo-2-fluorobenzene',          pin: 'K01251', mw: 175,    eq: 1, baseMmol: '', m: '' },
  { id: 'HCE-2', name: '1-Bromo-2,4-dimethoxybenzene',     pin: 'K01275', mw: 217.06, eq: 1, baseMmol: '', m: '' },
  { id: 'HCE-3', name: '1-Bromo-2-(trifluoromethoxy)benzene', pin: 'K01230', mw: 241.01, eq: 1, baseMmol: '', m: '' },
]
const initCom = (): Com[] => [
  { name: 'Piperazine',          pin: 'K00504', mw: 86.14,  eq: 1, baseMmol: '', cells: [{m:''},{m:''},{m:''}] },
  { name: 'Ruphos',              pin: 'K00595', mw: 466.6,  eq: 0.05, baseMmol: '', cells: [{m:''},{m:''},{m:''}] },
  { name: 'Sodium tert-butoxide',pin: 'K00622', mw: 96.1,   eq: 2,    baseMmol: '', cells: [{m:''},{m:''},{m:''}] },
]

export type ResRow = {
  ri: number
  cpdName: string; cpdPin: string; cpdMw: string
  inputMg: string; outputMg: string
  purPct: string; meth: string
  atts: { name: string; dataUrl: string }[]
  sides: SideRow[]
}
export type SideRow = {
  id: number
  cpdName: string; cpdPin: string; cpdMw: string
  inputMg: string; outputMg: string
  purPct: string; meth: string
  atts: { name: string; dataUrl: string }[]
}

export type HistEntry = { at: string; actor: string; type: 'create'|'edit'|'sign'; desc: string }
export type SigState = { status: 'unsigned'|'signed'|'locked'; signerName: string; signedAt: string|null; lockedAt: string|null; hash: string }

export default function MoaDetailPage({ card, onBack }: Props) {
  const [exp, setExp] = useState<Exp[]>(initExp)
  const [com, setCom] = useState<Com[]>(initCom)
  const [baseTarget, setBaseTarget] = useState<BaseTarget>('exp')
  const [refOn, setRefOn] = useState(true)
  const [lastMod, setLastMod] = useState<string | null>(null)
  const [metaTitle, setMetaTitle] = useState(card.title)
  const [metaProject, setMetaProject] = useState(card.project)
  const [closeConfirm, setCloseConfirm] = useState(false)

  // 실험조건
  const [cond, setCond] = useState({ temp: '', time: '', atm: '', solvent: '', solventCustom: '', solventVol: '' })

  // 실험기록
  const [recTab, setRecTab] = useState<'공통' | string>('공통')
  const [recTexts, setRecTexts] = useState<Record<string, string>>({})

  // 실험결과
  const initResRows = (): ResRow[] => exp.map((e, ri) => ({
    ri, cpdName: '', cpdPin: '', cpdMw: '',
    inputMg: '', outputMg: '', purPct: '', meth: '', atts: [], sides: []
  }))
  const [resRows, setResRows] = useState<ResRow[]>(initResRows)

  // 대시보드 노트
  const [dashNote, setDashNote] = useState({ text: '', imgs: [] as { name: string; dataUrl: string }[] })

  // 전자서명
  const [sig, setSig] = useState<SigState>({ status: 'unsigned', signerName: '', signedAt: null, lockedAt: null, hash: '' })

  // 변경이력
  const [history, setHistory] = useState<HistEntry[]>([
    { at: new Date().toISOString().replace('T', ' ').slice(0,19), actor: '제은', type: 'create', desc: '실험 생성' }
  ])

  const addHistory = useCallback((type: HistEntry['type'], desc: string) => {
    setHistory(prev => [{
      at: new Date().toISOString().replace('T', ' ').slice(0,19),
      actor: '제은', type, desc
    }, ...prev])
  }, [])

  const updateLastMod = () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0,16)
    setLastMod(now)
    addHistory('edit', '저장됨')
  }

  const confirmClose = () => setCloseConfirm(true)

  // AI 내보내기
  const [aiCopied, setAiCopied] = useState(false)
  const handleAiExport = async () => {
    const line = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    const expLines = exp.map((e, i) => {
      const res = resRows[i]
      const yieldStr = res?.outputMg ? `수득량 ${res.outputMg}mg` : (res?.purPct ? `순도 ${res.purPct}%` : '—')
      return `  [${e.id}] ${e.name} (MW ${e.mw ?? '?'}, ${e.eq} eq)  →  ${yieldStr}`
    }).join('\n')
    const comLines = com.length === 0 ? '  (없음)' :
      com.map(c => `  ${c.name} (${c.eq} eq, MW ${c.mw ?? '?'})`).join('\n')
    const condStr = [
      cond.temp ? `온도 ${cond.temp}°C` : '',
      cond.time ? `시간 ${cond.time}h` : '',
      cond.atm ? `분위기 ${cond.atm}` : '',
      (cond.solvent || cond.solventCustom) ? `용매 ${cond.solvent || cond.solventCustom}` : '',
    ].filter(Boolean).join(' · ') || '—'
    const prompt = [
      line, `📋 AI 상담용 실험 요약`,
      `   프로젝트: ${metaProject}   반응명: ${metaTitle}`,
      line,
      `[변수 시약]`, expLines || '  (없음)',
      ``, `[공통 시약]`, comLines,
      ``, `[반응 조건]`, `  ${condStr}`,
      line, `❓ 질문: `,
    ].join('\n')
    const ok = await copyToClipboard(prompt)
    if (ok) { setAiCopied(true); setTimeout(() => setAiCopied(false), 2000) }
  }

  // 서명 해제 on edit (signed → unsigned)
  const markEdited = () => {
    if (sig.status === 'signed') {
      setSig(prev => ({ ...prev, status: 'unsigned', signerName: '', signedAt: null, hash: '' }))
      addHistory('edit', '수정됨 (서명 자동 해제)')
    } else {
      addHistory('edit', '정량 테이블 수정됨')
    }
  }

  // baseMmol 계산용
  const getBaseMmolV = (ri: number) => getBaseMmol(ri, baseTarget, exp, com)

  // 농도 자동
  const concVal = (() => {
    const vol = parseFloat(cond.solventVol)
    if (!vol || isNaN(vol)) return null
    // 기준물질의 첫 번째 mmol (HCE-1 기준)
    const mmol = getBaseMmolV(0)
    if (!mmol) return null
    return (mmol / vol).toFixed(3) + ' M'
  })()

  return (
    <>
      {/* Button bar */}
      <div className="btnbar">
        <button className="btn btn-b" onClick={onBack}>← 목록</button>
        <button className="btn">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="6" width="14" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
          프린트
        </button>
        <button className="btn">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 7l4-2M6 9l4 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          공유
        </button>
        <button className="btn">연구노트 가져오기</button>
        <button className="btn btn-p" onClick={updateLastMod}>저장</button>
        <button className="btn btn-grn" onClick={confirmClose}>종료</button>
        <button className="btn btn-d">삭제</button>
      </div>

      {/* Metabar */}
      <div className="metabar">
        <div className="mi"><span className="ml">실험번호</span><span className="mv" style={{ fontFamily: 'var(--fm)', fontSize: 11 }}>{card.id}</span></div>
        <div className="mi"><span className="ml">실험명</span><input className="mi-inp" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} /></div>
        <div className="mi"><span className="ml">프로젝트</span><input className="mi-inp" value={metaProject} onChange={e => setMetaProject(e.target.value)} /></div>
        <div className="mi"><span className="ml">작성자</span><span className="mv">제은</span></div>
        <div className="mi"><span className="ml">생성일</span><span className="mv">{card.createdAt}</span></div>
        <div className="mi"><span className="ml">마지막수정일</span><span className="mv">{lastMod ?? '—'}</span></div>
      </div>

      {/* Detail content */}
      <div className="detail-main">

        {/* Scheme */}
        <div className="card">
          <div className="ch">
            <span className="ct">Scheme</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={handleAiExport}
                className="btn"
                style={{ fontSize: 10, padding: '3px 10px', background: aiCopied ? '#f0fdf8' : '#e8f0fa', color: aiCopied ? '#1D9E75' : '#1a6bb5', borderColor: aiCopied ? '#9FE1CB' : '#b5d4f4', transition: 'all .15s' }}
                title="실험 데이터를 AI 상담용 텍스트로 클립보드에 복사"
              >
                {aiCopied ? '✓ 복사됨' : '🤖 AI와 상담'}
              </button>
              <button className="btn" style={{ fontSize: 10, padding: '3px 8px' }}>편집</button>
            </div>
          </div>
          <div className="sb">
            <div className="cbox"><div className="vbadge">변수</div><div className="cl clE">E</div><div className="cm">실험별 상이</div></div>
            <div className="cplus">+</div>
            {com.map((c, i) => (
              <React.Fragment key={i}>
                <div className="cbox"><div className="cl">{String.fromCharCode(65 + i)}</div><div className="cm">{c.eq} eq</div></div>
                {i < com.length - 1 && <div className="cplus">+</div>}
              </React.Fragment>
            ))}
            <div className="aw" style={{ margin: '0 12px' }}><div className="al" /></div>
            <div className="cprod"><div className="cprod-l">P</div></div>
          </div>
        </div>

        {/* 시작물질/반응물 */}
        <QuantTable
          exp={exp} com={com} baseTarget={baseTarget} refOn={refOn}
          onExpChange={(newExp) => { setExp(newExp); markEdited() }}
          onComChange={(newCom) => { setCom(newCom); markEdited() }}
          onBaseChange={setBaseTarget}
          onRefChange={setRefOn}
        />

        {/* 실험 조건 */}
        <div className="card">
          <div className="ch"><span className="ct">실험 조건</span></div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px', alignItems: 'flex-end' }}>
              <CondField label="반응 온도" unit="°C">
                <input className="cond-inp" style={{ width: 58 }} placeholder="—" value={cond.temp} onChange={e => setCond(p => ({ ...p, temp: e.target.value }))} />
              </CondField>
              <CondField label="반응 시간" unit="h">
                <input className="cond-inp" style={{ width: 58 }} placeholder="—" value={cond.time} onChange={e => setCond(p => ({ ...p, time: e.target.value }))} />
              </CondField>
              <CondField label="대기 조건">
                <select className="cond-sel" value={cond.atm} onChange={e => setCond(p => ({ ...p, atm: e.target.value }))}>
                  <option value="">선택</option>
                  <option>N₂</option><option>Ar</option><option>Air</option><option>진공</option>
                </select>
              </CondField>
              <CondField label="용매">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <select className="cond-sel" value={cond.solvent} onChange={e => setCond(p => ({ ...p, solvent: e.target.value }))}>
                    <option value="">선택</option>
                    <option>THF</option><option>DCM</option><option>DMF</option><option>Toluene</option>
                    <option>EtOH</option><option>MeCN</option><option>H₂O</option>
                  </select>
                  <input className="cond-inp" style={{ width: 72 }} placeholder="직접 입력" value={cond.solventCustom} onChange={e => setCond(p => ({ ...p, solventCustom: e.target.value }))} />
                </div>
              </CondField>
              <CondField label="용매 용량" unit="mL">
                <input className="cond-inp" style={{ width: 58 }} placeholder="—" value={cond.solventVol} onChange={e => setCond(p => ({ ...p, solventVol: e.target.value }))} />
              </CondField>
              <CondField label={<>농도 <span style={{ color: 'var(--blue)', fontSize: 8 }}>자동</span></>}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className={`mmol-auto${concVal ? ' has' : ''}`} style={{ minWidth: 52, textAlign: 'right' }}>{concVal ?? '—'}</span>
                  <span className="cond-unit">M</span>
                </div>
              </CondField>
            </div>
          </div>
        </div>

        {/* 실험 기록 */}
        <div className="card">
          <div className="rec-panel" style={{ borderTop: 'none' }}>
            <div className="rec-phd">
              <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '.5px' }}>실험 기록</span>
              <span style={{ fontSize: 9, color: 'var(--tx3)' }}>공통 + 실험번호별 개별 기록</span>
            </div>
            <div className="rec-tabs">
              {['공통', ...exp.map(e => e.id)].map(tab => (
                <div key={tab} className={`rec-tab${recTab === tab ? ' on' : ''}`} onClick={() => setRecTab(tab)}>
                  {tab}
                </div>
              ))}
            </div>
            <div className="rec-body">
              <textarea
                className="rec-ta"
                rows={3}
                placeholder={`${recTab} 실험 기록을 입력하세요...`}
                value={recTexts[recTab] ?? ''}
                onChange={e => setRecTexts(p => ({ ...p, [recTab]: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* 실험 결과 */}
        <ResultSection
          exp={exp} com={com} baseTarget={baseTarget}
          resRows={resRows} setResRows={setResRows}
          onEdit={() => addHistory('edit', '실험결과 입력됨')}
        />

        {/* 실험 대시보드 */}
        <DashboardCard
          exp={exp} resRows={resRows}
          dashNote={dashNote} setDashNote={setDashNote}
        />

        {/* 댓글 */}
        <CommentsCard />

        {/* 전자서명 + 변경이력 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <SignatureCard sig={sig} setSig={setSig} onHistory={addHistory} style={{ flex: 1 }} />
          <HistoryCard history={history} style={{ flex: 1 }} />
        </div>

      </div>

      {/* 종료 확인 모달 */}
      {closeConfirm && (
        <div className="confirm-toast">
          <div className="confirm-box">
            <div style={{ fontWeight: 500, marginBottom: 8 }}>종료처리 하시겠습니까?</div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 16, lineHeight: 1.7 }}>
              종료처리 후에는 수정을 할 수 없습니다.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button className="btn" onClick={() => setCloseConfirm(false)}>취소</button>
              <button className="btn btn-grn" onClick={() => { setCloseConfirm(false); addHistory('sign', '실험 종료처리') }}>종료</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CondField({ label, unit, children }: { label: React.ReactNode; unit?: string; children: React.ReactNode }) {
  return (
    <div className="cond-field">
      <div className="cond-lbl">{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}
        {unit && <span className="cond-unit">{unit}</span>}
      </div>
    </div>
  )
}

function CommentsCard() {
  const [comments, setComments] = useState([
    { id: 1, author: '지수', init: '지', bg: '#e8f0fa', color: '#1a6bb5', text: 'HCE-1 yield가 예상보다 높게 나왔네요. 반응 시간 조건 한번 더 확인해볼게요.', time: '14:22' },
    { id: 2, author: '민재', init: '민', bg: '#e6f7f1', color: '#1D9E75', text: '동의합니다. 온도도 체크 필요할 것 같아요.', time: '15:10' },
  ])
  const [inp, setInp] = useState('')

  const submit = () => {
    if (!inp.trim()) return
    setComments(prev => [...prev, {
      id: Date.now(), author: '제은', init: '제',
      bg: 'var(--blue-bg)', color: 'var(--blue)',
      text: inp, time: new Date().toTimeString().slice(0,5)
    }])
    setInp('')
  }

  return (
    <div className="cmt-card">
      <div className="ch" style={{ padding: '6px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ct">댓글</span>
          <span style={{ fontSize: 9, background: 'var(--blue-bg)', color: 'var(--blue)', padding: '1px 7px', borderRadius: 8, fontWeight: 500 }}>{comments.length}</span>
        </div>
      </div>
      <div className="cmt-list">
        {comments.map(c => (
          <div className="cmt-item" key={c.id}>
            <div className="avatar" style={{ background: c.bg, color: c.color }}>{c.init}</div>
            <div className="cmt-bubble">
              <div className="cmt-meta">
                <span className="cmt-author">{c.author}</span>
                <span className="cmt-time">{c.time}</span>
              </div>
              <div className="cmt-text">{c.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="cmt-ia">
        <div className="avatar" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', width: 26, height: 26, fontSize: 10, flexShrink: 0 }}>제</div>
        <textarea
          className="cmt-inp"
          placeholder="댓글 입력... · Enter 등록 / Shift+Enter 줄바꿈"
          rows={1}
          value={inp}
          onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
        />
        <button className="btn btn-p" style={{ fontSize: 10, padding: '4px 12px', flexShrink: 0 }} onClick={submit}>등록</button>
      </div>
    </div>
  )
}
