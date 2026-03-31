/**
 * AddCabinetModal — 시약장 추가 3단계 마법사
 * Step1: 이름(20자), 색상선택(8개스와치), 설명(80자), 탭미리보기
 * Step2: 파일업로드(xlsx/csv), 템플릿다운로드, 건너뛰기
 * Step3: 멤버검색, pill, 건너뛰기
 * Done: 완료화면
 */
import { useEffect, useRef, useState } from 'react';
import type { Cabinet, CabinetMember } from '@/types/reagent';
import { downloadTemplate } from '@/utils/excel';

const COLOR_SWATCHES = [
  '#185FA5', '#1D9E75', '#D85A30', '#BA7517',
  '#534AB7', '#993556', '#A32D2D', '#5F5E5A',
];

const MOCK_MEMBERS: CabinetMember[] = [
  { userId: 'u001', name: '김지훈', email: 'jihun.kim@jinunote.io', initials: '김지', avatarColor: '#185FA5', textColor: '#fff' },
  { userId: 'u002', name: '이수연', email: 'sooyeon.lee@jinunote.io', initials: '이수', avatarColor: '#1D9E75', textColor: '#fff' },
  { userId: 'u003', name: '박민준', email: 'minjun.park@jinunote.io', initials: '박민', avatarColor: '#534AB7', textColor: '#fff' },
  { userId: 'u004', name: '정하은', email: 'haeun.jung@jinunote.io', initials: '정하', avatarColor: '#993556', textColor: '#fff' },
  { userId: 'u005', name: '최재원', email: 'jaewon.choi@jinunote.io', initials: '최재', avatarColor: '#BA7517', textColor: '#fff' },
];

interface AddCabinetModalProps {
  onClose: () => void;
  onCreated: (cabinet: Cabinet) => void;
}

export default function AddCabinetModal({ onClose, onCreated }: AddCabinetModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memberInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1); // 1 | 2 | 3 | 4(done)

  // Step 1
  const [cabName, setCabName] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [coaEnabled, setCoaEnabled] = useState(false);

  // Step 2
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Step 3
  const [memberQuery, setMemberQuery] = useState('');
  const [members, setMembers] = useState<CabinetMember[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Done
  const [createdCab, setCreatedCab] = useState<Cabinet | null>(null);

  // ESC 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const step1Valid = cabName.trim().length > 0 && color !== '';

  function handleFile(f: File) {
    setFileErr('');
    const ext = '.' + f.name.split('.').pop()!.toLowerCase();
    if (!['.xlsx', '.csv'].includes(ext)) { setFileErr('xlsx 또는 csv 파일만 업로드 가능해요'); return; }
    if (f.size > 10 * 1024 * 1024) { setFileErr('10MB 이하 파일만 업로드 가능해요'); return; }
    setFile(f);
  }

  function memberSearch(q: string) {
    setMemberQuery(q);
    setShowDropdown(q.trim().length > 0);
  }

  function addMember(m: CabinetMember) {
    if (!members.find((x) => x.userId === m.userId)) {
      setMembers((prev) => [...prev, m]);
    }
    setMemberQuery('');
    setShowDropdown(false);
    memberInputRef.current?.focus();
  }

  function removeMember(userId: string) {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  }

  const filteredMembers = MOCK_MEMBERS.filter(
    (m) =>
      !members.find((x) => x.userId === m.userId) &&
      (m.name.toLowerCase().includes(memberQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(memberQuery.toLowerCase()))
  );

  function doSubmit() {
    const newCab: Cabinet = {
      id: 'cab_' + Date.now(),
      name: cabName.trim(),
      color,
      isFavorite: false,
      displayOrder: 999,
      count: 0,
      description: description.trim() || undefined,
      members,
      coaEnabled: coaEnabled || undefined,
    };
    setCreatedCab(newCab);
    setStep(4);
    // 3초 후 닫기 + 탭 추가
    setTimeout(() => {
      onCreated(newCab);
      onClose();
    }, 3000);
  }

  function goNext() {
    if (step === 3) { doSubmit(); return; }
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  const stepLabels = ['기본 정보', '시약 업로드', '멤버 공유'];

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
        zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,.12),0 2px 6px rgba(0,0,0,.06)',
        width: '460px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>시약장 추가</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '18px', lineHeight: 1, padding: '2px 6px' }}>✕</button>
        </div>

        {/* 스텝 인디케이터 */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px 0', flexShrink: 0 }}>
            {stepLabels.map((label, i) => {
              const num = i + 1;
              const isDone = num < step;
              const isActive = num === step;
              return (
                <div key={num} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? undefined : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: isDone ? '#3B6D11' : isActive ? 'var(--text)' : 'var(--muted)', fontWeight: isActive ? 500 : 400, whiteSpace: 'nowrap' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 600, flexShrink: 0,
                      background: isDone ? '#EAF3DE' : isActive ? '#185FA5' : 'var(--surface2)',
                      color: isDone ? '#3B6D11' : isActive ? '#fff' : 'var(--muted)',
                    }}>
                      {isDone ? '✓' : num}
                    </div>
                    {label}
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: '1px', background: 'var(--border)', margin: '0 8px', minWidth: '20px' }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* 바디 */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* Step 1 */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  시약장 이름<span style={{ color: '#D85A30' }}>*</span>
                  <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{cabName.length}/20</span>
                </div>
                <input
                  value={cabName}
                  onChange={(e) => setCabName(e.target.value)}
                  maxLength={20}
                  placeholder="시약장 이름을 입력하세요"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: '12px', border: '1px solid var(--border2)', borderRadius: '8px', outline: 'none', color: 'var(--text)', fontFamily: 'inherit' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#185FA5')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border2)')}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>
                  색상<span style={{ color: '#D85A30' }}>*</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLOR_SWATCHES.map((c) => (
                    <div
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer',
                        border: color === c ? '2px solid #185FA5' : '2px solid transparent',
                        boxShadow: color === c ? '0 0 0 2px #185FA5' : undefined,
                        transition: 'transform .1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>설명 <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(선택)</span></span>
                  <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{description.length}/80</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={80}
                  placeholder="시약장에 대한 설명을 입력하세요"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: '12px', border: '1px solid var(--border2)', borderRadius: '8px', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical', minHeight: '64px' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#185FA5')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border2)')}
                />
              </div>

              {/* COA 모드 토글 */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  htmlFor="coaToggle"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '12px', borderRadius: '8px', cursor: 'pointer',
                    background: coaEnabled ? '#EAF3DE' : 'var(--surface2)',
                    border: `1px solid ${coaEnabled ? '#5DCAA5' : 'var(--border2)'}`,
                    transition: 'background .15s, border-color .15s',
                  }}
                >
                  <input
                    id="coaToggle"
                    type="checkbox"
                    checked={coaEnabled}
                    onChange={(e) => setCoaEnabled(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#1D9E75', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>🔬 자체 합성 COA 모드</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.5 }}>
                      이 시약장의 시약에 COA (Certificate of Analysis) 발행 기능을 활성화합니다.<br />
                      자체 합성 화합물을 관리하는 시약장에만 활성화하세요.
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>탭 미리보기</div>
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color || 'var(--border2)', flexShrink: 0 }} />
                    <span style={{ color: cabName ? 'var(--text)' : 'var(--muted)' }}>{cabName || '시약장 이름'}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>탭 미리보기</span>
                </div>
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>
                  시약 파일 업로드 <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(선택)</span>
                </div>
                {!file ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? '#378ADD' : 'var(--border2)'}`,
                      borderRadius: '10px', padding: '28px 16px', textAlign: 'center', cursor: 'pointer',
                      background: dragOver ? '#E6F1FB' : 'transparent', transition: 'border-color .15s, background .15s',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>📂</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--blue)' }}>클릭</strong>하거나 파일을 여기에 드래그하세요<br />.xlsx, .csv 형식 / 최대 10MB
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface2)' }}>
                    <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    <span style={{ fontSize: '10px', background: '#EAF3DE', color: '#3B6D11', borderRadius: '4px', padding: '2px 6px', flexShrink: 0 }}>업로드 준비됨</span>
                    <button onClick={() => { setFile(null); setFileErr(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}>✕</button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }} />
                {fileErr && <div style={{ fontSize: '11px', color: '#D85A30', marginTop: '5px' }}>{fileErr}</div>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => downloadTemplate()} style={{ fontSize: '11px', color: 'var(--blue)', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: 0 }}>📥 템플릿 다운로드</button>
                <button onClick={() => setStep(3)} style={{ fontSize: '11px', color: 'var(--blue)', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: 0 }}>지금은 건너뛰기</button>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.6, marginTop: '12px' }}>
                <strong style={{ color: 'var(--text)' }}>필수 컬럼:</strong> 컴파운드명, CAS 번호, 위치, 용량<br />
                <strong style={{ color: 'var(--text)' }}>선택 컬럼:</strong> 핀번호, 공급자, SMILES, MW, 순도, 주의사항<br />
                첫 행은 헤더로 인식. 최대 500행까지 한 번에 등록 가능.
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>멤버 검색</div>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={memberInputRef}
                    value={memberQuery}
                    onChange={(e) => memberSearch(e.target.value)}
                    placeholder="이름 또는 이메일로 검색"
                    autoComplete="off"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: '12px', border: '1px solid var(--border2)', borderRadius: '8px', outline: 'none', color: 'var(--text)', fontFamily: 'inherit' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#185FA5')}
                    onBlur={(e) => { setTimeout(() => setShowDropdown(false), 150); e.currentTarget.style.borderColor = 'var(--border2)'; }}
                  />
                  {showDropdown && filteredMembers.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border2)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,.1)', zIndex: 10, maxHeight: '180px', overflowY: 'auto' }}>
                      {filteredMembers.map((m) => (
                        <div
                          key={m.userId}
                          onMouseDown={() => addMember(m)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '12px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: m.avatarColor, color: m.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
                            {m.initials}
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 500, color: 'var(--text)' }}>{m.name}</div>
                            <div style={{ color: 'var(--muted)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {members.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {members.map((m) => (
                    <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px 4px 4px', background: 'var(--surface2)', borderRadius: '20px', fontSize: '12px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: m.avatarColor, color: m.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 600 }}>{m.initials}</div>
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>{m.name}</span>
                      <button onClick={() => removeMember(m.userId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '12px', lineHeight: 1, padding: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px 14px', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.7 }}>
                초대된 멤버는 이 시약장의 시약을 조회·수정할 수 있어요.<br />
                초대 메일이 발송되며, 수락 전까지는 대기 상태로 표시돼요.
              </div>

              <button onClick={() => doSubmit()} style={{ fontSize: '11px', color: 'var(--blue)', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, marginTop: '10px', display: 'inline-block' }}>멤버 없이 건너뛰기</button>
            </>
          )}

          {/* Done Screen */}
          {step === 4 && createdCab && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '14px' }}>✓</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{createdCab.name}이(가) 만들어졌어요!</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                {file ? '파일 1개 업로드 완료' : '파일 업로드 없음'}
                {' · '}
                {members.length > 0 ? `멤버 ${members.length}명 초대됨` : '초대된 멤버 없음'}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '12px', color: 'var(--text)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: createdCab.color, flexShrink: 0 }} />
                {createdCab.name}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        {step < 4 && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span />
            <div style={{ display: 'flex', gap: '8px' }}>
              {step > 1 && (
                <button
                  onClick={goBack}
                  style={{ padding: '7px 16px', fontSize: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e0e3ea')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                >
                  이전
                </button>
              )}
              <button
                onClick={goNext}
                disabled={step === 1 && !step1Valid}
                style={{
                  padding: '7px 16px', fontSize: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit',
                  background: (step === 1 && !step1Valid) ? '#B5D4F4' : '#185FA5',
                  color: '#fff',
                  opacity: (step === 1 && !step1Valid) ? 0.7 : 1,
                }}
              >
                {step === 3 ? '시약장 만들기' : '다음'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
