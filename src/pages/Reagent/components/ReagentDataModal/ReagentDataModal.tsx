/**
 * ReagentDataModal — 시약 상세/수정 모달 (880px, 스크롤 없이 한 화면)
 * 오픈: 카드/행 클릭
 * 닫기: ✕ | CANCEL | ESC | 외부 클릭
 */
import { useEffect, useRef, useState } from 'react';
import type { ReagentItem, RecentUser } from '@/types/reagent';
import StructureBox from '../StructureBox';
import { timeAgo } from '@/utils/timeAgo';
import { useToast } from '../Toast';

interface ReagentDataModalProps {
  reagent: ReagentItem | null;
  recentUsers: RecentUser[];
  cabinets: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (id: string, data: Partial<ReagentItem>) => void;
  onDisuse: (id: string) => void;
}

export default function ReagentDataModal({
  reagent,
  recentUsers,
  cabinets,
  onClose,
  onSave,
  onDisuse,
}: ReagentDataModalProps) {
  const { showToast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);

  // 편집 상태 (편의상 로컬 state)
  const [form, setForm] = useState<Partial<ReagentItem>>({});

  useEffect(() => {
    if (reagent) setForm({ ...reagent });
  }, [reagent]);

  // ESC 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!reagent) return null;

  function field(
    label: string,
    key: keyof ReagentItem,
    opts: { required?: boolean; readonly?: boolean; mono?: boolean; placeholder?: string } = {},
  ) {
    const value = form[key] as string | number | undefined;
    return (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)' }}>
          {label}
          {opts.required && <span style={{ color: 'var(--red)' }}> *</span>}
        </label>
        <input
          readOnly={opts.readonly}
          value={value ?? ''}
          placeholder={opts.placeholder ?? '—'}
          onChange={(e) => !opts.readonly && setForm((f) => ({ ...f, [key]: e.target.value }))}
          style={{
            padding: '6px 10px',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--r)',
            fontSize: '12px',
            fontFamily: opts.mono ? "'IBM Plex Mono', monospace" : 'inherit',
            background: opts.readonly ? 'var(--surface2)' : 'var(--surface)',
            color: opts.readonly ? 'var(--muted)' : 'var(--text)',
            outline: 'none',
          }}
          onFocus={(e) => { if (!opts.readonly) e.currentTarget.style.borderColor = 'var(--blue-mid)'; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
        />
      </div>
    );
  }

  function handleSave() {
    if (!form.compoundName?.trim()) {
      showToast('컴파운드명은 필수입니다');
      return;
    }
    onSave(reagent!.id, form);
    showToast('수정이 저장되었습니다');
    onClose();
  }

  function handleDisuse() {
    if (window.confirm('말소 처리하시겠습니까?')) {
      onDisuse(reagent!.id);
      showToast('말소 처리되었습니다');
      onClose();
    }
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal
      aria-label="시약 데이터"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.4)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: '880px', maxHeight: '90vh',
        background: 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'modalIn .18s ease',
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <span style={{ fontSize: '15px', fontWeight: 500 }}>시약 데이터</span>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{ fontSize: '16px', color: 'var(--hint)', cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1, transition: 'color .12s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--hint)')}
          >✕</button>
        </div>

        {/* 바디 */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── 좌측 패널 (250px) ── */}
          <div style={{
            width: '250px', flexShrink: 0,
            borderRight: '1px solid var(--border)',
            background: 'var(--surface2)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* 구조식 */}
            <div style={{
              height: '160px', background: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <StructureBox smiles={reagent.smiles} variant="modal" />
            </div>

            {/* 필드 */}
            <div style={{
              padding: '14px 16px', display: 'flex', flexDirection: 'column',
              gap: '10px', overflowY: 'auto', flex: 1,
            }}>
              {field('핀 번호', 'pinCode', { readonly: true, mono: true })}
              {field('커스텀 핀 번호', 'customPin', { placeholder: '필요 시 입력' })}
              {field('명칭', 'alias', { required: true })}

              {/* 시약장 그룹 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)' }}>
                  시약장 그룹 <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <select
                  value={form.cabinetId ?? reagent.cabinetId}
                  onChange={(e) => setForm((f) => ({ ...f, cabinetId: e.target.value }))}
                  style={{
                    padding: '6px 10px', border: '1px solid var(--border2)',
                    borderRadius: 'var(--r)', fontSize: '12px',
                    fontFamily: 'inherit', background: 'var(--surface)',
                    color: 'var(--text)', outline: 'none',
                  }}
                >
                  {cabinets.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {field('등록자', 'registeredBy', { readonly: true })}

              {/* 최근 사용자 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)' }}>최근 사용자</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {recentUsers.slice(0, 3).map((u) => (
                    <div key={u.userId} style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      padding: '5px 8px',
                      background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: u.avatarColor, color: u.textColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px', fontWeight: 500, flexShrink: 0,
                      }}>
                        {u.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--hint)' }}>{u.actionLabel}</div>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--hint)', whiteSpace: 'nowrap' }}>
                        {timeAgo(u.actionAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── 우측 패널 ── */}
          <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* 화합물 정보 */}
            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>화합물 정보</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                {field('컴파운드', 'compoundName', { required: true })}
              </div>
              {/* SMILES */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)' }}>SMILES</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={form.smiles ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, smiles: e.target.value }))}
                    style={{
                      flex: 1, padding: '6px 10px', border: '1px solid var(--border2)',
                      borderRadius: 'var(--r)', fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '11px', background: 'var(--surface)', color: 'var(--text)', outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blue-mid)')}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--border2)')}
                  />
                  <button
                    onClick={() => showToast('Scheme 뷰어 준비 중')}
                    style={{
                      padding: '6px 10px', fontSize: '11px', fontFamily: 'inherit',
                      border: '1px solid var(--border2)', borderRadius: 'var(--r)',
                      background: 'var(--surface2)', color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Scheme
                  </button>
                </div>
              </div>

              {field('CAS 번호', 'casNumber', { mono: true })}
              {field('MW', 'mw')}
              {field('mp', 'mp')}
              {field('bp', 'bp')}
              {field('d', 'density')}
              {field('순도', 'purity')}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />

            {/* 보관 및 구매 정보 */}
            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>보관 및 구매 정보</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              {/* 용량 (suffix unit) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted)' }}>용량 <span style={{ color: 'var(--red)' }}>*</span></label>
                <div style={{ display: 'flex' }}>
                  <input
                    type="number"
                    value={form.quantity ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                    style={{
                      flex: 1, padding: '6px 10px', border: '1px solid var(--border2)',
                      borderRadius: 'var(--r) 0 0 var(--r)',
                      fontSize: '12px', fontFamily: 'inherit',
                      background: 'var(--surface)', color: 'var(--text)', outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blue-mid)')}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--border2)')}
                  />
                  <span style={{
                    padding: '6px 10px', border: '1px solid var(--border2)', borderLeft: 'none',
                    borderRadius: '0 var(--r) var(--r) 0',
                    fontSize: '11px', color: 'var(--hint)', background: 'var(--surface2)',
                  }}>
                    {reagent.unit}
                  </span>
                </div>
              </div>

              {field('위치', 'location', { required: true })}
              {field('공급자', 'supplier')}
              {field('제품번호', 'productNumber')}
              {field('샵링크', 'shopLink', { placeholder: '구매 링크' })}
              {field('연구노트 번호', 'labNoteNumber')}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />

            {/* 기타 */}
            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>기타</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              {field('주의사항', 'notes')}
            </div>

            {/* QR + MSDS */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              {/* QR */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>QR 코드</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', background: 'var(--surface2)',
                  borderRadius: 'var(--r)', border: '1px solid var(--border)',
                }}>
                  {/* 간단한 SVG QR 플레이스홀더 */}
                  <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
                    <rect width="44" height="44" fill="white"/>
                    <rect x="2"  y="2"  width="16" height="16" fill="none" stroke="#1A1D23" strokeWidth="1.5"/>
                    <rect x="5"  y="5"  width="10" height="10" fill="#1A1D23"/>
                    <rect x="26" y="2"  width="16" height="16" fill="none" stroke="#1A1D23" strokeWidth="1.5"/>
                    <rect x="29" y="5"  width="10" height="10" fill="#1A1D23"/>
                    <rect x="2"  y="26" width="16" height="16" fill="none" stroke="#1A1D23" strokeWidth="1.5"/>
                    <rect x="5"  y="29" width="10" height="10" fill="#1A1D23"/>
                    <rect x="26" y="26" width="4"  height="4"  fill="#1A1D23"/>
                    <rect x="32" y="26" width="4"  height="4"  fill="#1A1D23"/>
                    <rect x="38" y="26" width="4"  height="4"  fill="#1A1D23"/>
                    <rect x="26" y="32" width="4"  height="4"  fill="#1A1D23"/>
                    <rect x="32" y="32" width="8"  height="4"  fill="#1A1D23"/>
                    <rect x="26" y="38" width="16" height="4"  fill="#1A1D23"/>
                  </svg>
                  <span style={{ fontSize: '10px', color: 'var(--hint)', fontFamily: "'IBM Plex Mono', monospace", flex: 1, wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {reagent.qrUrl ?? '—'}
                  </span>
                  <button
                    onClick={() => showToast('QR 코드를 저장했습니다')}
                    style={{
                      padding: '4px 10px', fontSize: '10px', fontFamily: 'inherit',
                      border: '1px solid var(--border2)', borderRadius: 'var(--r)',
                      background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer',
                    }}
                  >
                    QR 저장
                  </button>
                </div>
              </div>

              {/* MSDS */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>MSDS 첨부파일</div>
                <div
                  onClick={() => showToast('파일을 선택해주세요')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && showToast('파일을 선택해주세요')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px',
                    border: '1px dashed var(--border2)',
                    borderRadius: 'var(--r)',
                    fontSize: '11px', color: 'var(--hint)',
                    cursor: 'pointer', transition: 'border-color .12s, color .12s',
                    height: '62px',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue-mid)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--blue)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--hint)';
                  }}
                >
                  <span>📎</span>
                  <span>Add Attachment...</span>
                  <span style={{ marginLeft: 'auto', fontSize: '10px' }}>0 / 1 (0.0B)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: '8px', padding: '12px 20px',
          borderTop: '1px solid var(--border)', flexShrink: 0,
        }}>
          <button className="btn" onClick={onClose}>CANCEL</button>
          <button
            className="btn"
            onClick={handleDisuse}
            style={{ color: 'var(--red)', borderColor: '#F09595' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-lt)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
          >
            DIS USE
          </button>
          <button className="btn btn-primary" onClick={handleSave}>MODIFY</button>
        </div>
      </div>
    </div>
  );
}
