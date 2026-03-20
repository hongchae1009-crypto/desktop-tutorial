import React, { useState } from 'react';
import type { Reagent } from '../../../../types/moa';
import { SAMPLE_REAGENTS } from '../../../../utils/moa';

interface ReagentSearchModalProps {
  title?: string;
  onSelect: (reagent: Reagent) => void;
  onClose: () => void;
}

const ReagentSearchModal: React.FC<ReagentSearchModalProps> = ({
  title = '시약 검색',
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const filtered = SAMPLE_REAGENTS.filter(r =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.pin.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.32)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', border: '0.5px solid #d0d4dc', borderRadius: 10,
          padding: 16, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>{title}</div>

        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="시약명 또는 PIN 검색..."
          style={{
            width: '100%', padding: '6px 10px', border: '0.5px solid #d0d4dc', borderRadius: 6,
            fontSize: 11, fontFamily: 'inherit', color: '#1a1c21', background: '#f7f8fa',
            marginBottom: 8, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#1a6bb5'}
          onBlur={e => e.target.style.borderColor = '#d0d4dc'}
        />

        <div style={{
          maxHeight: 170, overflowY: 'auto',
          border: '0.5px solid #e0e0e0', borderRadius: 5,
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: 10, color: '#9099aa', textAlign: 'center' }}>
              검색 결과 없음
            </div>
          ) : (
            filtered.map((r, i) => (
              <div
                key={i}
                onClick={() => onSelect(r)}
                style={{
                  padding: '6px 10px', fontSize: 10, cursor: 'pointer',
                  borderBottom: '0.5px solid #f0f0f0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e8f0fa')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <span>{r.name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#aaa' }}>
                  {r.pin} · MW {r.mw}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={onClose}
            style={{
              fontSize: 11, padding: '4px 11px', borderRadius: 5, border: '0.5px solid #e2e4e9',
              background: '#fff', color: '#1a1c21', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReagentSearchModal;
