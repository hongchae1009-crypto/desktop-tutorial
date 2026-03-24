/**
 * SendToMoaModal — 시약장 → 모아실험 연동 2단계 모달
 *
 * Step 1: 어느 모아실험에 넣을지 선택 (라디오, 새 만들기 인라인 폼)
 * Step 2: 각 시약을 변수시약 / 공통시약으로 분류
 * Done:   초록 체크 + 요약 + "모아실험으로 이동" 버튼
 */
import { useEffect, useRef, useState } from 'react';
import type { BasketItem } from '@/types/reagent';

// ── Mock 모아실험 데이터 ───────────────────────────────────
type MoaStatus = 'active' | 'done' | 'draft';

interface MoaListItem {
  id: string;
  title: string;
  status: MoaStatus;
  expCount: number;
  project: string;
}

const MOCK_MOA_LIST: MoaListItem[] = [
  { id: 'moa_001', title: 'HCE-260309', status: 'active', expCount: 3, project: '2026 Piperazine' },
  { id: 'moa_002', title: 'HCE-260215 Amide coupling', status: 'done', expCount: 6, project: '2026 Amide' },
  { id: 'moa_003', title: 'HCE-260301 Reductive amination', status: 'draft', expCount: 5, project: '2026 Piperazine' },
];

const STATUS_LABEL: Record<MoaStatus, string> = {
  active: '진행 중',
  done: '완료',
  draft: '초안',
};

const STATUS_COLOR: Record<MoaStatus, string> = {
  active: '#1D9E75',
  done: '#185FA5',
  draft: '#888',
};

// ── 시약 분류 타입 ────────────────────────────────────────
type ReagentRole = 'variable' | 'common';

// ── Props ────────────────────────────────────────────────
interface Props {
  open: boolean;
  basket: Record<string, BasketItem>;
  onClose: () => void;
  onSuccess: (moaId: string) => void;
}

// ── 스텝퍼 아이템 ─────────────────────────────────────────
type StepState = 'done' | 'current' | 'pending';

function StepBubble({ label, state }: { label: string; state: StepState }) {
  const bg =
    state === 'done'    ? '#EAF3DE' :
    state === 'current' ? '#185FA5' :
    '#e2e4e9';
  const color =
    state === 'done'    ? '#3B6D11' :
    state === 'current' ? '#fff' :
    '#888';
  const text = state === 'done' ? '✓' : label;
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%',
      background: bg, color, fontSize: 10, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {text}
    </div>
  );
}

function StepLabel({ children, current }: { children: string; current: boolean }) {
  return (
    <span style={{ fontSize: 11, fontWeight: current ? 500 : 400, color: current ? '#1a1c21' : '#888' }}>
      {children}
    </span>
  );
}

export default function SendToMoaModal({ open, basket, onClose, onSuccess }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── 스텝 상태 ────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 'done'>(1);

  // ── Step 1 상태 ──────────────────────────────────────────
  // active가 있으면 첫 번째 active를 기본 선택
  const defaultMoaId = MOCK_MOA_LIST.find((m) => m.status === 'active')?.id ?? MOCK_MOA_LIST[0]?.id ?? '';
  const [selectedMoaId, setSelectedMoaId] = useState<string>(defaultMoaId);
  const [isNewMoa, setIsNewMoa] = useState(false);
  const [newMoaTitle, setNewMoaTitle] = useState('');

  // ── Step 2 상태 ──────────────────────────────────────────
  const basketList = Object.values(basket);
  const [roles, setRoles] = useState<Record<string, ReagentRole>>(() => {
    const init: Record<string, ReagentRole> = {};
    basketList.forEach((item, idx) => {
      init[item.id] = idx === 0 ? 'variable' : 'variable';
    });
    return init;
  });

  // basket이 바뀌면 roles 재초기화
  useEffect(() => {
    const init: Record<string, ReagentRole> = {};
    Object.values(basket).forEach((item) => {
      init[item.id] = 'variable';
    });
    setRoles(init);
  }, [open]);

  // ── ESC 닫기 ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // ── 모달이 열릴 때마다 step 초기화 ──────────────────────
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedMoaId(defaultMoaId);
      setIsNewMoa(false);
      setNewMoaTitle('');
    }
  }, [open]);

  if (!open) return null;

  // ── 파생값 ───────────────────────────────────────────────
  const resolvedMoaTitle = isNewMoa
    ? (newMoaTitle.trim() || '새 모아실험')
    : (MOCK_MOA_LIST.find((m) => m.id === selectedMoaId)?.title ?? '');

  const variableItems = basketList.filter((item) => roles[item.id] === 'variable');
  const commonItems   = basketList.filter((item) => roles[item.id] === 'common');

  // ── Step 1 → Step 2 ──────────────────────────────────────
  function handleStep1Next() {
    if (!isNewMoa && !selectedMoaId) return;
    if (isNewMoa && !newMoaTitle.trim()) return;
    setStep(2);
  }

  // ── Step 2 → Done ────────────────────────────────────────
  function handleStep2Confirm() {
    // 완료 화면으로
    setStep('done');
  }

  // ── 모아실험으로 이동 ─────────────────────────────────────
  function handleNavigate() {
    const moaId = isNewMoa ? `moa_new_${Date.now()}` : selectedMoaId;
    onSuccess(moaId);
  }

  // ── 오버레이 클릭 닫기 ────────────────────────────────────
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // ── 스텝퍼 렌더 ──────────────────────────────────────────
  function renderStepper() {
    const step1State: StepState = step === 1 ? 'current' : 'done';
    const step2State: StepState = step === 2 ? 'current' : step === 'done' ? 'done' : 'pending';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <StepBubble label="1" state={step1State} />
        <StepLabel current={step === 1}>모아실험 선택</StepLabel>
        <div style={{ flex: 1, height: 1, background: '#e2e4e9', margin: '0 4px' }} />
        <StepBubble label="2" state={step2State} />
        <StepLabel current={step === 2}>시약 분류</StepLabel>
      </div>
    );
  }

  // ── Step 1 렌더 ───────────────────────────────────────────
  function renderStep1() {
    return (
      <>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: '#1a1c21' }}>
          어느 모아실험에 넣을까요?
        </p>

        {/* 모아실험 목록 */}
        <div style={{
          border: '0.5px solid #e2e4e9', borderRadius: 8,
          overflow: 'hidden', marginBottom: 8,
        }}>
          {MOCK_MOA_LIST.map((moa, idx) => {
            const isSelected = !isNewMoa && selectedMoaId === moa.id;
            return (
              <label
                key={moa.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  borderTop: idx === 0 ? 'none' : '0.5px solid #e2e4e9',
                  background: isSelected ? '#f5f9ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'background .1s',
                }}
              >
                <input
                  type="radio"
                  name="moa-select"
                  value={moa.id}
                  checked={isSelected}
                  onChange={() => { setSelectedMoaId(moa.id); setIsNewMoa(false); }}
                  style={{ accentColor: '#185FA5', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1c21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {moa.title}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 8,
                      background: `${STATUS_COLOR[moa.status]}18`,
                      color: STATUS_COLOR[moa.status],
                      border: `0.5px solid ${STATUS_COLOR[moa.status]}55`,
                      fontWeight: 500,
                    }}>
                      {STATUS_LABEL[moa.status]}
                    </span>
                    <span>·</span>
                    <span>{moa.project}</span>
                    <span>·</span>
                    <span>실험 {moa.expCount}개</span>
                  </div>
                </div>
              </label>
            );
          })}

          {/* 새 모아실험 만들기 */}
          <div style={{
            borderTop: '0.5px solid #e2e4e9',
            background: isNewMoa ? '#f5f9ff' : '#fff',
          }}>
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="moa-select"
                value="__new__"
                checked={isNewMoa}
                onChange={() => { setIsNewMoa(true); setSelectedMoaId(''); }}
                style={{ accentColor: '#185FA5', flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, color: '#185FA5', fontWeight: 500 }}>
                + 새 모아실험 만들어서 넣기
              </span>
            </label>

            {/* 인라인 입력 폼 */}
            {isNewMoa && (
              <div style={{ padding: '0 14px 12px 44px' }}>
                <input
                  autoFocus
                  value={newMoaTitle}
                  onChange={(e) => setNewMoaTitle(e.target.value)}
                  placeholder="새 모아실험 이름 입력"
                  maxLength={50}
                  style={{
                    width: '100%', padding: '7px 10px',
                    border: '0.5px solid #b5d4f4', borderRadius: 6,
                    fontSize: 12, fontFamily: 'inherit', outline: 'none',
                    background: '#f7fbff', color: '#1a1c21',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#185FA5')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#b5d4f4')}
                />
              </div>
            )}
          </div>
        </div>

        {/* 다음 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px', fontSize: 12, fontFamily: 'inherit',
              border: '0.5px solid #e2e4e9', borderRadius: 6,
              background: '#fff', color: '#444', cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={handleStep1Next}
            disabled={isNewMoa ? !newMoaTitle.trim() : !selectedMoaId}
            style={{
              padding: '7px 16px', fontSize: 12, fontFamily: 'inherit',
              border: 'none', borderRadius: 6,
              background: (isNewMoa ? newMoaTitle.trim() : selectedMoaId) ? '#185FA5' : '#ccc',
              color: '#fff', cursor: (isNewMoa ? newMoaTitle.trim() : selectedMoaId) ? 'pointer' : 'not-allowed',
              transition: 'background .12s',
            }}
          >
            다음 →
          </button>
        </div>
      </>
    );
  }

  // ── Step 2 렌더 ───────────────────────────────────────────
  function renderStep2() {
    const varCount = variableItems.length;
    const comCount = commonItems.length;

    return (
      <>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#1a1c21' }}>
          각 시약을 어느 자리에 넣을까요?
        </p>
        <p style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '1px 7px', borderRadius: 8,
            background: '#E6F1FB', color: '#0C447C',
            border: '0.5px solid #85B7EB', fontSize: 10, marginRight: 4,
          }}>변수시약</span>
          = 실험마다 달라지는 시약 &nbsp;/&nbsp;
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '1px 7px', borderRadius: 8,
            background: '#E1F5EE', color: '#085041',
            border: '0.5px solid #5DCAA5', fontSize: 10, marginRight: 4,
          }}>공통시약</span>
          = 모든 실험에 공통으로 쓰는 시약
        </p>

        {/* 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 72px 72px',
          gap: 4,
          padding: '6px 10px',
          background: '#f7f8fa',
          borderRadius: '6px 6px 0 0',
          border: '0.5px solid #e2e4e9',
          borderBottom: 'none',
        }}>
          <span style={{ fontSize: 10, color: '#888', fontWeight: 500 }}>시약명</span>
          <span style={{ fontSize: 10, color: '#0C447C', fontWeight: 500, textAlign: 'center' }}>변수시약</span>
          <span style={{ fontSize: 10, color: '#085041', fontWeight: 500, textAlign: 'center' }}>공통시약</span>
        </div>

        {/* 시약 목록 */}
        <div style={{
          border: '0.5px solid #e2e4e9',
          borderRadius: '0 0 6px 6px',
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          {basketList.map((item, idx) => {
            const role = roles[item.id] ?? 'variable';
            return (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 72px 72px',
                  gap: 4,
                  padding: '9px 10px',
                  borderTop: idx === 0 ? 'none' : '0.5px solid #e2e4e9',
                  alignItems: 'center',
                  background: '#fff',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 500, color: '#1a1c21',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 9, color: '#888', fontFamily: "'IBM Plex Mono', monospace", marginTop: 1 }}>
                    {item.pinCode}
                  </div>
                </div>

                {/* 변수시약 라디오 */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="radio"
                      name={`role-${item.id}`}
                      checked={role === 'variable'}
                      onChange={() => setRoles((prev) => ({ ...prev, [item.id]: 'variable' }))}
                      style={{ accentColor: '#185FA5' }}
                    />
                    {role === 'variable' && (
                      <span style={{
                        fontSize: 9, padding: '1px 6px', borderRadius: 8,
                        background: '#E6F1FB', color: '#0C447C',
                        border: '0.5px solid #85B7EB', fontWeight: 500, whiteSpace: 'nowrap',
                      }}>
                        변수
                      </span>
                    )}
                  </label>
                </div>

                {/* 공통시약 라디오 */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="radio"
                      name={`role-${item.id}`}
                      checked={role === 'common'}
                      onChange={() => setRoles((prev) => ({ ...prev, [item.id]: 'common' }))}
                      style={{ accentColor: '#1D9E75' }}
                    />
                    {role === 'common' && (
                      <span style={{
                        fontSize: 9, padding: '1px 6px', borderRadius: 8,
                        background: '#E1F5EE', color: '#085041',
                        border: '0.5px solid #5DCAA5', fontWeight: 500, whiteSpace: 'nowrap',
                      }}>
                        공통
                      </span>
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* 요약 */}
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: '#f7f8fa', border: '0.5px solid #e2e4e9',
          fontSize: 11, color: '#555', marginBottom: 16,
          display: 'flex', gap: 12, flexWrap: 'wrap',
        }}>
          <span>
            <span style={{
              padding: '1px 7px', borderRadius: 8,
              background: '#E6F1FB', color: '#0C447C',
              border: '0.5px solid #85B7EB', fontSize: 10, fontWeight: 500,
            }}>변수시약</span>
            {' '}{varCount}개
          </span>
          <span>
            <span style={{
              padding: '1px 7px', borderRadius: 8,
              background: '#E1F5EE', color: '#085041',
              border: '0.5px solid #5DCAA5', fontSize: 10, fontWeight: 500,
            }}>공통시약</span>
            {' '}{comCount}개
          </span>
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={() => setStep(1)}
            style={{
              padding: '7px 16px', fontSize: 12, fontFamily: 'inherit',
              border: '0.5px solid #e2e4e9', borderRadius: 6,
              background: '#fff', color: '#444', cursor: 'pointer',
            }}
          >
            ← 이전
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '7px 16px', fontSize: 12, fontFamily: 'inherit',
                border: '0.5px solid #e2e4e9', borderRadius: 6,
                background: '#fff', color: '#444', cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              onClick={handleStep2Confirm}
              style={{
                padding: '7px 16px', fontSize: 12, fontFamily: 'inherit',
                border: 'none', borderRadius: 6,
                background: '#185FA5', color: '#fff', cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0C447C')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#185FA5')}
            >
              확인
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Done 화면 렌더 ────────────────────────────────────────
  function renderDone() {
    const varCount = variableItems.length;
    const comCount = commonItems.length;

    return (
      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        {/* 초록 체크 원 */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#E1F5EE', border: '2px solid #5DCAA5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          fontSize: 22, color: '#1D9E75',
        }}>
          ✓
        </div>

        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1c21', marginBottom: 4 }}>
          {resolvedMoaTitle}으로 넘겼어요!
        </p>
        <p style={{ fontSize: 11, color: '#555', marginBottom: 18, lineHeight: 1.6 }}>
          변수시약 {varCount}개는 새 실험 행으로,{' '}
          공통시약 {comCount}개는 새 열로 추가됐어요.
        </p>

        {/* 요약 테이블 */}
        {basketList.length > 0 && (
          <div style={{
            border: '0.5px solid #e2e4e9', borderRadius: 8,
            overflow: 'hidden', marginBottom: 20, textAlign: 'left',
          }}>
            {/* 변수시약 */}
            {variableItems.length > 0 && (
              <>
                <div style={{
                  padding: '6px 12px',
                  background: '#E6F1FB', borderBottom: '0.5px solid #b5d4f4',
                  fontSize: 10, fontWeight: 500, color: '#0C447C',
                }}>
                  변수시약 ({variableItems.length}개) — 새 실험 행으로 추가
                </div>
                {variableItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '7px 12px',
                      borderBottom: idx < variableItems.length - 1 || commonItems.length > 0 ? '0.5px solid #e2e4e9' : 'none',
                      fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#1a1c21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, paddingRight: 8 }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 9, color: '#888', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
                      {item.pinCode}
                    </span>
                  </div>
                ))}
              </>
            )}
            {/* 공통시약 */}
            {commonItems.length > 0 && (
              <>
                <div style={{
                  padding: '6px 12px',
                  background: '#E1F5EE', borderBottom: '0.5px solid #5DCAA5',
                  borderTop: variableItems.length > 0 ? '0.5px solid #e2e4e9' : 'none',
                  fontSize: 10, fontWeight: 500, color: '#085041',
                }}>
                  공통시약 ({commonItems.length}개) — 새 열로 추가
                </div>
                {commonItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '7px 12px',
                      borderBottom: idx < commonItems.length - 1 ? '0.5px solid #e2e4e9' : 'none',
                      fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#1a1c21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, paddingRight: 8 }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 9, color: '#888', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
                      {item.pinCode}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 모아실험으로 이동 버튼 */}
        <button
          onClick={handleNavigate}
          style={{
            width: '100%', padding: '10px', fontSize: 12, fontFamily: 'inherit',
            border: 'none', borderRadius: 6,
            background: '#185FA5', color: '#fff', cursor: 'pointer',
            fontWeight: 500,
            transition: 'background .12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0C447C')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#185FA5')}
        >
          모아실험으로 이동 →
        </button>
      </div>
    );
  }

  // ── 모달 타이틀 ───────────────────────────────────────────
  const modalTitle =
    step === 1 ? '모아실험으로 넘기기' :
    step === 2 ? '시약 분류' :
    '완료';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        style={{
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 64px)',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div style={{
          padding: '16px 20px 14px',
          borderBottom: '0.5px solid #e2e4e9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1c21' }}>
            모아실험으로 넘기기
          </span>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: 24, height: 24, borderRadius: '50%',
              border: 'none', background: 'none',
              cursor: 'pointer', fontSize: 14, color: '#888',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f1f4')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            ✕
          </button>
        </div>

        {/* 바디 */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* 스텝퍼 (done 화면에서는 숨김) */}
          {step !== 'done' && renderStepper()}

          {/* 스텝별 콘텐츠 */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 'done' && renderDone()}
        </div>
      </div>
    </div>
  );
}
