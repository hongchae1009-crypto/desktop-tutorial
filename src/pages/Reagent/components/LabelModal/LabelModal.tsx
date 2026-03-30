import { useState, useEffect } from 'react';
import type { ReagentItem } from '@/types/reagent';
import StructureBox from '../StructureBox';

interface LabelModalProps {
  open: boolean;
  reagents: ReagentItem[];
  onClose: () => void;
}

type LabelSize = 'sm' | 'md' | 'lg';
interface LabelSizeConfig {
  label: string;
  widthMm: number;
  heightMm: number;
  cols: number;
  rows: number;
}
interface LabelIncludes {
  struct: boolean;
  cas: boolean;
  location: boolean;
  storage: boolean;
}

const LABEL_SIZES: Record<LabelSize, LabelSizeConfig> = {
  sm: { label: '소형 40×25mm', widthMm: 40, heightMm: 25, cols: 4, rows: 10 },
  md: { label: '중형 55×35mm', widthMm: 55, heightMm: 35, cols: 3, rows: 7 },
  lg: { label: '대형 65×45mm', widthMm: 65, heightMm: 45, cols: 2, rows: 6 },
};

const STORAGE_COLORS: Record<string, string> = {
  'RT':   '#6B7280', '냉장': '#3B82F6', '냉동':   '#8B5CF6',
  '극저온': '#06B6D4', '차광': '#F59E0B', '위험물': '#EF4444', '불활성': '#10B981',
};

// 미리보기 스케일: A4 595px = 210mm → 2.835px/mm
const SCALE = 2.835;
const GAP_MM = 2;

export default function LabelModal({ open, reagents, onClose }: LabelModalProps) {
  const [size, setSize] = useState<LabelSize>('md');
  const [inc, setInc] = useState<LabelIncludes>({ struct: true, cas: true, location: true, storage: true });

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  const cfg = LABEL_SIZES[size];
  const labelsPerPage = cfg.cols * cfg.rows;
  const totalPgs = Math.max(1, Math.ceil(reagents.length / labelsPerPage));
  const pages = Array.from({ length: totalPgs }, (_, i) =>
    reagents.slice(i * labelsPerPage, (i + 1) * labelsPerPage),
  );
  const previewW = cfg.widthMm * SCALE;
  const previewH = cfg.heightMm * SCALE;
  const previewGap = GAP_MM * SCALE;

  function toggleInc(k: keyof LabelIncludes) { setInc((p) => ({ ...p, [k]: !p[k] })); }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 5mm; }
          body > *:not(#label-modal-root) { display: none !important; }
          #label-modal-root {
            position: static !important;
            background: none !important;
            padding: 0 !important;
          }
          .label-ctrl-panel,
          .label-modal-head,
          .label-modal-foot { display: none !important; }
          .label-preview-area {
            padding: 0 !important;
            background: none !important;
            display: block !important;
            overflow: visible !important;
          }
          .label-page {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: ${GAP_MM}mm !important;
            page-break-after: always;
            break-after: page;
            width: 200mm !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            background: none !important;
            align-content: flex-start !important;
          }
          .label-page:last-child { page-break-after: auto; break-after: auto; }
          .label-item {
            break-inside: avoid;
            width: ${cfg.widthMm}mm !important;
            height: ${cfg.heightMm}mm !important;
            font-size: ${cfg.widthMm <= 40 ? '5.5pt' : cfg.widthMm <= 55 ? '6.5pt' : '7.5pt'} !important;
          }
        }
      `}</style>

      <div id="label-modal-root" style={{
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
          <div className="label-modal-head" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>라벨 인쇄 미리보기</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>✕</button>
          </div>

          {/* 바디 */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* 설정 패널 */}
            <div className="label-ctrl-panel" style={{
              width: 200, flexShrink: 0, borderRight: '1px solid var(--border)',
              padding: '16px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px',
            }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '8px' }}>
                  라벨 크기
                </div>
                {(Object.entries(LABEL_SIZES) as [LabelSize, LabelSizeConfig][]).map(([key, c]) => (
                  <button key={key} onClick={() => setSize(key)} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '6px 10px', marginBottom: '4px', borderRadius: '6px',
                    border: '1px solid', cursor: 'pointer', fontSize: '12px',
                    background: size === key ? 'var(--blue-lt)' : 'var(--surface2)',
                    color: size === key ? 'var(--blue)' : 'var(--text)',
                    borderColor: size === key ? '#85B7EB' : 'var(--border2)',
                  }}>
                    {c.label}
                  </button>
                ))}
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '8px' }}>
                  포함 항목
                </div>
                {([
                  { key: 'struct',   label: '구조식' },
                  { key: 'cas',      label: 'CAS 번호' },
                  { key: 'location', label: '보관 위치' },
                  { key: 'storage',  label: '보관 조건' },
                ] as { key: keyof LabelIncludes; label: string }[]).map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    <input type="checkbox" checked={inc[key]} onChange={() => toggleInc(key)} style={{ accentColor: 'var(--blue)', cursor: 'pointer' }} />
                    {label}
                  </label>
                ))}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--hint)', lineHeight: 1.7 }}>
                페이지당 {labelsPerPage}개<br />
                총 {totalPgs}페이지
              </div>
            </div>

            {/* A4 미리보기 */}
            <div className="label-preview-area" style={{
              flex: 1, overflowY: 'auto', padding: '20px',
              background: '#F3F4F6', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '16px',
            }}>
              {pages.map((pageReagents, pageIdx) => (
                <div key={pageIdx} className="label-page" style={{
                  width: 595, minHeight: 200,
                  background: '#fff', padding: '14px',
                  border: '0.5px solid rgba(0,0,0,.15)',
                  boxShadow: '0 2px 8px rgba(0,0,0,.1)',
                  display: 'flex', flexWrap: 'wrap',
                  gap: `${previewGap}px`,
                  alignContent: 'flex-start',
                }}>
                  {pageReagents.map((r) => (
                    <LabelItem
                      key={r.id}
                      reagent={r}
                      inc={inc}
                      size={size}
                      width={previewW}
                      height={previewH}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 모달 풋터 */}
          <div className="label-modal-foot" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px', borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {reagents.length}개 시약 · {totalPgs}페이지
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" onClick={onClose}>취소</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨 인쇄하기</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 라벨 1개 컴포넌트 ── */
function LabelItem({
  reagent: r, inc, size, width, height,
}: {
  reagent: ReagentItem;
  inc: LabelIncludes;
  size: LabelSize;
  width: number;
  height: number;
}) {
  const isSmall = size === 'sm';
  const fontSize = isSmall ? '6px' : size === 'md' ? '7px' : '8px';
  const pad = isSmall ? '1px 3px' : '2px 4px';
  const hasStruct = inc.struct && !!r.smiles;

  return (
    <div className="label-item" style={{
      width, height,
      border: '0.5px solid #374151',
      borderRadius: '2px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'IBM Plex Sans KR', sans-serif",
      fontSize,
      color: '#1A1D23',
      background: '#fff',
      boxSizing: 'border-box',
    }}>
      {/* 헤더: PIN + 화합물명 */}
      <div style={{
        padding: pad,
        borderBottom: '0.5px solid #D1D5DB',
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        flexShrink: 0,
        background: '#F9FAFB',
        overflow: 'hidden',
      }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#185FA5', flexShrink: 0, fontSize }}>
          {r.pinCode}
        </span>
        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize }}>
          {r.compoundName}
        </span>
      </div>

      {/* 바디 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* 구조식 */}
        {hasStruct && (
          <div style={{
            width: isSmall ? '38%' : '36%',
            flexShrink: 0,
            borderRight: '0.5px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: '#fff',
          }}>
            <StructureBox smiles={r.smiles} variant="table" />
          </div>
        )}

        {/* 정보 */}
        <div style={{
          flex: 1,
          padding: isSmall ? '1px 2px' : '2px 4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          overflow: 'hidden',
          justifyContent: 'center',
        }}>
          {inc.cas && r.casNumber && (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', overflow: 'hidden' }}>
              <span style={{ color: '#6B7280', flexShrink: 0, fontSize }}>CAS</span>
              <span style={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize }}>
                {r.casNumber}
              </span>
            </div>
          )}
          {inc.location && r.location && (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', overflow: 'hidden' }}>
              <span style={{ color: '#6B7280', flexShrink: 0, fontSize }}>위치</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize }}>
                {r.location}
              </span>
            </div>
          )}
          {inc.storage && r.storageConditions && r.storageConditions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', marginTop: '1px' }}>
              {r.storageConditions.map((cond) => (
                <span key={cond} style={{
                  fontSize: isSmall ? '5px' : '6px',
                  padding: '0 2px',
                  borderRadius: '2px',
                  background: STORAGE_COLORS[cond] ?? '#6B7280',
                  color: '#fff',
                  fontWeight: 500,
                }}>
                  {cond}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
