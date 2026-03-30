import { useState, useEffect } from 'react';
import SmilesDrawer from 'smiles-drawer';
import StructureBox from '../StructureBox';

interface StructureSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearch: (smiles: string) => void;
  onClear: () => void;
  currentQuery: string;
}

export default function StructureSearchModal({
  open, onClose, onSearch, onClear, currentQuery,
}: StructureSearchModalProps) {
  const [inputSmiles, setInputSmiles] = useState(currentQuery);
  const [parseError, setParseError] = useState(false);

  // 외부 query 변경 시 입력창 동기화
  useEffect(() => { setInputSmiles(currentQuery); }, [currentQuery]);

  // ESC 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // SMILES 유효성 실시간 검증
  useEffect(() => {
    if (!inputSmiles.trim()) { setParseError(false); return; }
    SmilesDrawer.parse(
      inputSmiles,
      () => setParseError(false),
      () => setParseError(true),
    );
  }, [inputSmiles]);

  if (!open) return null;

  function handleApply() {
    if (!inputSmiles.trim() || parseError) return;
    onSearch(inputSmiles.trim());
    onClose();
  }

  function handleClear() {
    setInputSmiles('');
    setParseError(false);
    onClear();
    onClose();
  }

  const canApply = inputSmiles.trim() !== '' && !parseError;
  const showError = parseError && inputSmiles.trim() !== '';
  const previewSmiles = canApply ? inputSmiles : undefined;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        width: 460, background: 'var(--surface)',
        borderRadius: '12px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,.2)',
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>구조 검색</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>✕</button>
        </div>

        {/* 바디 */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* SMILES 입력 */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--hint)', marginBottom: '6px' }}>
              SMILES 입력
            </div>
            <textarea
              value={inputSmiles}
              onChange={(e) => setInputSmiles(e.target.value)}
              placeholder="예: C1CC(=O)NC2=CC=CC=C12"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px',
                border: `1px solid ${showError ? '#EF4444' : 'var(--border2)'}`,
                borderRadius: 'var(--r)',
                fontSize: '12px', fontFamily: 'monospace',
                background: 'var(--surface2)', color: 'var(--text)',
                outline: 'none', resize: 'vertical',
                transition: 'border-color .15s',
              }}
            />
            {showError && (
              <p style={{ fontSize: '11px', color: '#EF4444', margin: '4px 0 0' }}>
                올바르지 않은 SMILES 형식입니다
              </p>
            )}
          </div>

          {/* 구조식 미리보기 */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--hint)', marginBottom: '6px' }}>
              구조식 미리보기
            </div>
            <div style={{
              display: 'flex', justifyContent: 'center', padding: '16px',
              background: 'var(--surface2)', borderRadius: 'var(--r)',
              border: '1px solid var(--border2)',
            }}>
              <StructureBox smiles={previewSmiles} variant="modal" />
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--hint)', margin: 0, lineHeight: 1.7 }}>
            SMILES 문자열을 입력하면 해당 구조식과 동일한 시약을 검색합니다.<br />
            InChI Key 첫 14자가 일치하는 시약도 함께 표시됩니다.
          </p>
        </div>

        {/* 풋터 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '10px 20px', borderTop: '1px solid var(--border)', gap: '8px',
        }}>
          {currentQuery && (
            <button className="btn" onClick={handleClear} style={{ marginRight: 'auto' }}>
              검색 초기화
            </button>
          )}
          <button className="btn" onClick={onClose}>취소</button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={!canApply}
            style={{ opacity: canApply ? 1 : 0.5, cursor: canApply ? 'pointer' : 'not-allowed' }}
          >
            검색 적용
          </button>
        </div>
      </div>
    </div>
  );
}
