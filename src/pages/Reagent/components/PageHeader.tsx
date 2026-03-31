import { useRef } from 'react';
import { useToast } from './Toast';
import type { ReagentItem } from '@/types/reagent';
import { downloadExcel } from '@/utils/excel';

interface PageHeaderProps {
  searchValue: string;
  onSearch: (q: string) => void;
  onRegister: () => void;
  onPrint: () => void;
  onLabelPrint: () => void;
  onStructureSearch: () => void;
  onQrScan?: () => void;
  structureActive?: boolean;
  reagents?: ReagentItem[];
  isMobile?: boolean;
}

export default function PageHeader({ searchValue, onSearch, onRegister, onPrint, onLabelPrint, onStructureSearch, onQrScan, structureActive = false, reagents = [], isMobile = false }: PageHeaderProps) {
  const { showToast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(v), 300);
  }

  async function handleExcelDownload() {
    if (reagents.length === 0) {
      showToast('다운로드할 시약이 없습니다');
      return;
    }
    try {
      await downloadExcel(reagents);
      showToast('엑셀 다운로드 완료');
    } catch {
      showToast('엑셀 다운로드 실패');
    }
  }

  /* ── 모바일 레이아웃 ── */
  if (isMobile) {
    return (
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '8px 12px 0',
        flexShrink: 0,
      }}>
        {/* Row 1: 검색 + 등록 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              defaultValue={searchValue}
              placeholder="시약 검색"
              onChange={handleInput}
              aria-label="시약 검색"
              style={{
                width: '100%', padding: '8px 34px 8px 12px', boxSizing: 'border-box',
                border: '1px solid var(--border2)', borderRadius: 'var(--r)',
                fontSize: '13px', fontFamily: 'inherit',
                background: 'var(--surface2)', color: 'var(--text)', outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-mid)'; e.currentTarget.style.background = 'var(--surface)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)'; }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hint)', fontSize: '16px' }}>⌕</span>
          </div>
          <button className="btn btn-primary" onClick={onRegister} style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>+ 등록</button>
        </div>

        {/* Row 2: 아이콘 툴바 */}
        <div style={{ display: 'flex', gap: '6px', paddingBottom: '8px', overflowX: 'auto' }}>
          {[
            { label: '🏷 라벨', onClick: onLabelPrint, active: false },
            { label: '🖨 인쇄', onClick: onPrint, active: false },
            { label: '📊 엑셀', onClick: handleExcelDownload, active: false },
            { label: structureActive ? '🔬 구조 ✓' : '🔬 구조', onClick: onStructureSearch, active: structureActive },
            ...(onQrScan ? [{ label: '📷 QR 스캔', onClick: onQrScan, active: false }] : []),
          ].map(({ label, onClick, active }) => (
            <button
              key={label}
              onClick={onClick}
              style={{
                whiteSpace: 'nowrap', padding: '5px 10px', fontSize: '11px',
                borderRadius: 'var(--r)', border: '1px solid',
                cursor: 'pointer', fontFamily: 'inherit',
                background: active ? 'var(--blue)' : 'var(--surface2)',
                color: active ? '#fff' : 'var(--muted)',
                borderColor: active ? 'var(--blue)' : 'var(--border2)',
                flexShrink: 0,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── 데스크톱 레이아웃 ── */
  return (
    <div style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 20px 0',
      flexShrink: 0,
    }}>
      {/* Row 1 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px', fontWeight: 500 }}>시약장</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--hint)' }}>
          🏠 / <span style={{ color: 'var(--muted)' }}>시약장</span>
        </span>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '10px' }}>
        {/* 검색창 */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '460px' }}>
          <input
            type="text"
            defaultValue={searchValue}
            placeholder="시약 검색"
            onChange={handleInput}
            aria-label="시약 검색"
            style={{
              width: '100%', padding: '7px 34px 7px 12px',
              border: '1px solid var(--border2)', borderRadius: 'var(--r)',
              fontSize: '12px', fontFamily: 'inherit',
              background: 'var(--surface2)', color: 'var(--text)', outline: 'none',
              transition: 'border-color .15s, background .15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-mid)'; e.currentTarget.style.background = 'var(--surface)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)'; }}
          />
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hint)', fontSize: '14px' }}>⌕</span>
        </div>

        <button className="btn btn-primary" onClick={onRegister}>+ 시약 등록</button>

        {/* 우측 보조 버튼 */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
          <button className="btn" onClick={onLabelPrint}>라벨</button>
          <button className="btn" onClick={onPrint}>A4 인쇄</button>
          <button className="btn" onClick={handleExcelDownload}>엑셀 다운로드</button>
          <button
            className={structureActive ? 'btn btn-primary' : 'btn'}
            onClick={onStructureSearch}
          >
            {structureActive ? '구조 검색 ✓' : '구조 검색'}
          </button>
          {onQrScan && (
            <button className="btn" onClick={onQrScan} title="QR 코드로 시약 검색">
              📷 QR 스캔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
