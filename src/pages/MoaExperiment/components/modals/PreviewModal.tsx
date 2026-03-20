import React, { useState } from 'react';
import type { AttFile } from '../../../../types/moa';

interface PreviewModalProps {
  files: AttFile[];
  initialIdx: number;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ files, initialIdx, onClose }) => {
  const [idx, setIdx] = useState(initialIdx);
  const file = files[idx];

  if (!file) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 10, overflow: 'hidden',
          width: 860, maxWidth: '92vw', maxHeight: '88vh',
          display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: '0.5px solid #e2e4e9', flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, borderRadius: '50%', background: '#f7f8fa',
              border: '0.5px solid #e2e4e9', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div style={{
          flex: 1, overflow: 'auto', padding: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f0f1f3', minHeight: 300,
        }}>
          {file.type === 'image' ? (
            <img
              src={file.dataUrl}
              alt={file.name}
              style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 4, objectFit: 'contain' }}
            />
          ) : file.type === 'pdf' ? (
            <iframe src={file.dataUrl} style={{ width: '100%', height: '65vh', border: 'none' }} title={file.name} />
          ) : (
            <div style={{ color: '#9099aa', fontSize: 12 }}>미리보기를 지원하지 않는 파일입니다.</div>
          )}
        </div>

        {/* 푸터 */}
        <div style={{
          padding: '8px 16px', borderTop: '0.5px solid #e2e4e9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={idx === 0}
              onClick={() => setIdx(i => i - 1)}
              style={{
                padding: '3px 10px', borderRadius: 4, border: '0.5px solid #e2e4e9',
                background: '#f7f8fa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
                opacity: idx === 0 ? 0.4 : 1,
              }}
            >
              ← 이전
            </button>
            <button
              disabled={idx === files.length - 1}
              onClick={() => setIdx(i => i + 1)}
              style={{
                padding: '3px 10px', borderRadius: 4, border: '0.5px solid #e2e4e9',
                background: '#f7f8fa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
                opacity: idx === files.length - 1 ? 0.4 : 1,
              }}
            >
              다음 →
            </button>
          </div>
          <span style={{ fontSize: 10, color: '#9099aa' }}>
            {idx + 1} / {files.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
