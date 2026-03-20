import React, { useState } from 'react'
import type { SigState, HistEntry } from './index'

interface Props {
  sig: SigState
  setSig: React.Dispatch<React.SetStateAction<SigState>>
  onHistory: (type: HistEntry['type'], desc: string) => void
  style?: React.CSSProperties
}

export default function SignatureCard({ sig, setSig, onHistory, style }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [lockOnSign, setLockOnSign] = useState(false)
  const [pw, setPw] = useState('')

  const genHash = () => {
    const s = Date.now().toString(36) + Math.random().toString(36).slice(2)
    return s.slice(0, 32).toUpperCase().match(/.{1,8}/g)?.join('-') ?? s
  }

  const doSign = (lock: boolean) => {
    if (!pw) { alert('비밀번호를 입력해주세요.'); return }
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    setSig({
      status: lock ? 'locked' : 'signed',
      signerName: '제은',
      signedAt: now,
      lockedAt: lock ? now : null,
      hash: genHash(),
    })
    onHistory('sign', lock ? '전자서명 + 잠금 완료' : '전자서명 완료')
    setShowModal(false)
    setPw('')
  }

  const doUnsign = () => {
    setSig({ status: 'unsigned', signerName: '', signedAt: null, lockedAt: null, hash: '' })
    onHistory('edit', '서명 해제')
  }

  const doLock = () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    setSig(prev => ({ ...prev, status: 'locked', lockedAt: now }))
    onHistory('sign', '잠금 처리')
  }

  return (
    <>
      <div className="sig-card" style={style}>
        <div className="ch" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="ct">전자서명</span>
          <span className={`sig-badge sig-${sig.status}`}>
            {sig.status === 'unsigned' ? '미서명' : sig.status === 'signed' ? '서명완료' : '잠금'}
          </span>
        </div>
        <div className="sig-body">
          {sig.status === 'unsigned' && (
            <>
              <div className="sig-preview" style={{ color: '#ccc', fontSize: 14 }}>서명 영역</div>
              <div className="sig-actions">
                <button className="btn btn-g" onClick={() => setShowModal(true)}>서명하기</button>
              </div>
            </>
          )}
          {sig.status === 'signed' && (
            <>
              <div className="sig-preview">{sig.signerName}</div>
              <div className="sig-info-row">
                <div className="sig-info-item"><span className="sig-info-label">서명자</span><span className="sig-info-val">{sig.signerName}</span></div>
                <div className="sig-info-item"><span className="sig-info-label">서명일시</span><span className="sig-info-val">{sig.signedAt}</span></div>
              </div>
              <div className="sig-hash">{sig.hash}</div>
              <div className="sig-actions">
                <button className="btn btn-d" onClick={doUnsign}>서명 해제</button>
                <button className="btn btn-p" onClick={doLock}>잠금</button>
              </div>
            </>
          )}
          {sig.status === 'locked' && (
            <>
              <div className="sig-preview">{sig.signerName}</div>
              <div className="sig-info-row">
                <div className="sig-info-item"><span className="sig-info-label">서명자</span><span className="sig-info-val">{sig.signerName}</span></div>
                <div className="sig-info-item"><span className="sig-info-label">서명일시</span><span className="sig-info-val">{sig.signedAt}</span></div>
                <div className="sig-info-item"><span className="sig-info-label">잠금일시</span><span className="sig-info-val">{sig.lockedAt}</span></div>
              </div>
              <div className="sig-hash">{sig.hash}</div>
              <div style={{ fontSize: 10, color: 'var(--blue)', background: 'var(--blue-bg)', padding: '6px 10px', borderRadius: 5, border: '0.5px solid var(--blue-bd)' }}>
                🔒 수정 불가 — 관리자만 잠금 해제 가능합니다.
              </div>
            </>
          )}
        </div>
      </div>

      {/* 서명 모달 */}
      {showModal && (
        <div className="mo-ov">
          <div className="mo-box" style={{ width: 360 }}>
            <div className="mo-title">전자서명</div>
            <div style={{ marginBottom: 12 }}>
              <div className="mo-label" style={{ marginBottom: 6 }}>서명 미리보기</div>
              <div className="sig-preview">제은</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div className="mo-label">비밀번호 확인</div>
              <input className="mo-inp" type="password" placeholder="비밀번호 입력" style={{ marginBottom: 0 }} value={pw} onChange={e => setPw(e.target.value)} />
            </div>
            <div style={{ fontSize: 9, color: 'var(--tx3)', background: 'var(--bg2)', padding: '8px 10px', borderRadius: 5, lineHeight: 1.8, marginBottom: 12, border: '0.5px solid var(--bd)' }}>
              ⚠️ 수정 시 서명이 자동 해제됩니다.<br />잠금 후에는 관리자만 잠금 해제 가능합니다.
            </div>
            <div className="mo-foot" style={{ gap: 6 }}>
              <button className="btn" onClick={() => { setShowModal(false); setPw('') }}>취소</button>
              <button className="btn" style={{ borderColor: 'var(--green)', color: 'var(--green)' }} onClick={() => doSign(false)}>서명만</button>
              <button className="btn btn-p" style={{ background: 'var(--green)', borderColor: 'var(--green)' }} onClick={() => doSign(true)}>서명 + 잠금</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
