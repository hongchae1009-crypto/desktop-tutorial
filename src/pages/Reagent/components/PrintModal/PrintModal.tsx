import { useState, useEffect } from 'react';
import type { ReagentItem } from '@/types/reagent';

interface PrintModalProps {
  open: boolean;
  reagents: ReagentItem[];
  cabinetName: string;
  onClose: () => void;
}

type Layout = 'card2' | 'card3' | 'table';
interface Includes { struct: boolean; cas: boolean; loc: boolean; qty: boolean; supplier: boolean; qr: boolean; }

// A4 스케일 기준 페이지당 항목 수 계산
// A4 높이 297mm → 미리보기 스케일(595px=210mm): 842px
// 상하 패딩(40px×2)=80px → 콘텐츠 762px
// 헤더 60px + 제목행(첫 페이지) 40px + 푸터 44px = 144px → 가용 618px
const A4_AVAIL_H = 618;
const CARD_ROW_H = 87;  // 카드헤더 23px + 바디 56px + gap 8px
const TABLE_HEAD_H = 28;
const TABLE_ROW_H = 22;

function getPerPage(layout: Layout): number {
  if (layout === 'table') return Math.floor((A4_AVAIL_H - TABLE_HEAD_H) / TABLE_ROW_H); // ≈26
  const cols = layout === 'card3' ? 3 : 2;
  return Math.floor(A4_AVAIL_H / CARD_ROW_H) * cols; // card2≈14, card3≈21
}

const today = new Date().toISOString().slice(0, 10);

export default function PrintModal({ open, reagents, cabinetName, onClose }: PrintModalProps) {
  const [layout, setLayout] = useState<Layout>('card2');
  const [inc, setInc] = useState<Includes>({ struct: true, cas: true, loc: true, qty: true, supplier: true, qr: false });

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  function toggleInc(k: keyof Includes) { setInc(p => ({ ...p, [k]: !p[k] })); }
  function doPrint() { window.print(); }

  const perPage = getPerPage(layout);
  const totalPgs = Math.max(1, Math.ceil(reagents.length / perPage));
  const pages = Array.from({ length: totalPgs }, (_, i) =>
    reagents.slice(i * perPage, (i + 1) * perPage),
  );
  const cols = layout === 'card3' ? 3 : layout === 'card2' ? 2 : 1;

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#print-modal-root) { display: none !important; }
          #print-modal-root { position: static !important; background: none !important; padding: 0 !important; }
          .print-ctrl-panel { display: none !important; }
          .print-modal-head { display: none !important; }
          .print-modal-foot { display: none !important; }
          .print-preview-area { padding: 0 !important; background: none !important; display: block !important; overflow: visible !important; }
          .print-paper { width: 100% !important; padding: 15mm 20mm !important; border: none !important; box-shadow: none !important; margin: 0 !important; page-break-after: always; break-after: page; }
          .print-paper:last-child { page-break-after: auto; break-after: auto; }
          .pcard { break-inside: avoid; }
          .print-table tr { break-inside: avoid; }
        }
      `}</style>

      <div id="print-modal-root" style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

        <div style={{
          width: 860, maxHeight: '90vh', background: 'var(--surface)',
          borderRadius: '12px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,.2)',
        }}>
          {/* 헤더 */}
          <div className="print-modal-head" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>A4 인쇄 미리보기</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>✕</button>
          </div>

          {/* 바디 */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* 설정 패널 */}
            <div className="print-ctrl-panel" style={{
              width: 200, flexShrink: 0, borderRight: '1px solid var(--border)',
              padding: '16px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px',
            }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '8px' }}>레이아웃</div>
                {(['card2', 'card3', 'table'] as Layout[]).map((l) => (
                  <button key={l} onClick={() => setLayout(l)} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '6px 10px', marginBottom: '4px', borderRadius: '6px',
                    border: '1px solid', cursor: 'pointer', fontSize: '12px',
                    background: layout === l ? 'var(--blue-lt)' : 'var(--surface2)',
                    color: layout === l ? 'var(--blue)' : 'var(--text)',
                    borderColor: layout === l ? '#85B7EB' : 'var(--border2)',
                  }}>
                    {l === 'card2' ? '2열 카드' : l === 'card3' ? '3열 카드' : '목록 테이블'}
                  </button>
                ))}
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '8px' }}>포함 항목</div>
                {([
                  { key: 'struct', label: '구조식' }, { key: 'cas', label: 'CAS 번호' },
                  { key: 'loc', label: '위치' }, { key: 'qty', label: '용량' },
                  { key: 'supplier', label: '공급자' }, { key: 'qr', label: 'QR 코드' },
                ] as { key: keyof Includes; label: string }[]).map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    <input type="checkbox" checked={inc[key]} onChange={() => toggleInc(key)} style={{ accentColor: 'var(--blue)', cursor: 'pointer' }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* A4 미리보기 — 여러 페이지 */}
            <div className="print-preview-area" style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              {pages.map((pageReagents, pageIdx) => (
                <div key={pageIdx} className="print-paper" style={{
                  width: 595, background: '#fff', padding: '40px 44px',
                  border: '0.5px solid rgba(0,0,0,.15)',
                  fontFamily: "'IBM Plex Sans KR', sans-serif",
                  fontSize: '9px', color: '#1A1D23',
                }}>
                  {/* 용지 헤더 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '1.5px solid #1A1D23', marginBottom: '14px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>
                      <span style={{ color: '#1A1D23' }}>Jinu</span>
                      <span style={{ color: '#185FA5' }}>note</span>
                    </div>
                    <div style={{ textAlign: 'right', color: '#6B7280', fontSize: '9px', lineHeight: 1.8 }}>
                      <div>연구실: KBS Laboratory</div>
                      <div>시약장: {cabinetName}</div>
                      <div>출력일: {today}</div>
                    </div>
                  </div>

                  {/* 제목 (첫 페이지만) */}
                  {pageIdx === 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600 }}>선택 시약 목록 ({reagents.length}개)</div>
                      <div style={{ fontSize: '8px', color: '#6B7280' }}>시약장 인쇄 · Jinunote</div>
                    </div>
                  )}

                  {/* 콘텐츠 */}
                  {layout !== 'table' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px' }}>
                      {pageReagents.map((r) => (
                        <div key={r.id} className="pcard" style={{
                          border: '0.5px solid #D1D5DB', borderRadius: '6px', overflow: 'hidden',
                        }}>
                          <div style={{ padding: '6px 8px', borderBottom: '0.5px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '9px', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.compoundName}</div>
                            <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#6B7280', flexShrink: 0, marginLeft: '4px' }}>{r.pinCode}</div>
                          </div>
                          <div style={{ display: 'flex' }}>
                            {inc.struct && (
                              <div style={{ width: 64, height: 56, background: '#F9FAFB', borderRight: '0.5px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '8px', color: '#9CA3AF' }}>구조식</span>
                              </div>
                            )}
                            <div style={{ flex: 1, padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {inc.cas && <Row label="CAS" val={r.casNumber ?? '—'} mono />}
                              {inc.loc && <Row label="위치" val={r.location} />}
                              {inc.qty && <Row label="용량" val={`${r.quantity} ${r.unit}`} />}
                              {inc.supplier && <Row label="공급자" val={r.supplier ?? '—'} />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                      {pageIdx === 0 && (
                        <thead>
                          <tr style={{ background: '#F3F4F6' }}>
                            <th style={th}>핀번호</th>
                            <th style={th}>컴파운드</th>
                            {inc.cas && <th style={th}>CAS 번호</th>}
                            {inc.loc && <th style={th}>위치</th>}
                            {inc.qty && <th style={th}>용량</th>}
                            {inc.supplier && <th style={th}>공급자</th>}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {pageReagents.map((r) => (
                          <tr key={r.id} style={{ borderBottom: '0.5px solid #E5E7EB' }}>
                            <td style={{ ...td, fontFamily: 'monospace' }}>{r.pinCode}</td>
                            <td style={td}>
                              <div style={{ fontWeight: 500 }}>{r.compoundName}</div>
                              {r.alias && <div style={{ color: '#6B7280', fontSize: '8px' }}>{r.alias}</div>}
                            </td>
                            {inc.cas && <td style={{ ...td, fontFamily: 'monospace' }}>{r.casNumber ?? '—'}</td>}
                            {inc.loc && <td style={td}>{r.location}</td>}
                            {inc.qty && <td style={td}>{r.quantity} {r.unit}</td>}
                            {inc.supplier && <td style={td}>{r.supplier ?? '—'}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* QR 섹션 (마지막 페이지만) */}
                  {inc.qr && pageIdx === totalPgs - 1 && (
                    <div style={{ marginTop: '16px', borderTop: '0.5px solid #E5E7EB', paddingTop: '12px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 600, marginBottom: '8px' }}>QR 코드</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {reagents.map((r) => (
                          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '140px' }}>
                            <div style={{ width: 36, height: 36, background: '#F3F4F6', border: '0.5px solid #E5E7EB', borderRadius: '4px', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '8px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '96px' }}>{r.compoundName}</div>
                              <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#6B7280' }}>{r.pinCode}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 용지 푸터 */}
                  <div style={{ marginTop: '20px', paddingTop: '8px', borderTop: '0.5px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: '8px' }}>
                    <span>KBS Laboratory · Jinunote 시약장 관리 시스템</span>
                    <span>{pageIdx + 1} / {totalPgs}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 모달 풋터 */}
          <div className="print-modal-foot" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px', borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{reagents.length}개 시약 · {totalPgs}페이지</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" onClick={onClose}>취소</button>
              <button className="btn btn-primary" onClick={doPrint}>🖨 인쇄하기</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, val, mono }: { label: string; val: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      <span style={{ color: '#6B7280', flexShrink: 0, width: '32px' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'monospace' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
    </div>
  );
}

const th: React.CSSProperties = { padding: '5px 7px', textAlign: 'left', fontWeight: 500, color: '#6B7280', borderBottom: '0.5px solid #D1D5DB' };
const td: React.CSSProperties = { padding: '5px 7px', verticalAlign: 'top' };
