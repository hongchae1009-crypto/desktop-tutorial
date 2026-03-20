import React, { useState } from 'react';
import type { Exp } from '../../../../types/moa';

interface RecordTabsProps {
  exp: Exp[];
}

const RecordTabs: React.FC<RecordTabsProps> = ({ exp }) => {
  const [tabIdx, setTabIdx] = useState(0);
  const [texts, setTexts] = useState<Record<string, string>>({});

  const currentKey = tabIdx === 0 ? 'common' : (exp[tabIdx - 1]?.id ?? 'common');
  const currentText = texts[currentKey] ?? '';

  const handleChange = (value: string) => {
    setTexts(prev => ({ ...prev, [currentKey]: value }));
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    fontSize: 10,
    cursor: 'pointer',
    color: active ? '#1a6bb5' : '#9099aa',
    fontWeight: active ? 500 : 400,
    borderBottom: active ? '2px solid #1a6bb5' : '2px solid transparent',
    background: active ? '#fff' : 'transparent',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    marginBottom: -0.5,
    border: 'none',
    fontFamily: 'inherit',
  });

  return (
    <div style={{ borderTop: '0.5px solid #e2e4e9' }}>
      {/* 탭 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 12px 0', background: '#f7f8fa',
      }}>
        <span style={{ fontSize: 9, fontWeight: 500, color: '#4a5060', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          실험 기록
        </span>
        <span style={{ fontSize: 9, color: '#9099aa' }}>공통 + 실험번호별 개별 기록</span>
      </div>
      <div style={{
        display: 'flex', background: '#f7f8fa',
        borderBottom: '0.5px solid #e2e4e9', overflowX: 'auto',
      }}>
        <button style={tabStyle(tabIdx === 0)} onClick={() => setTabIdx(0)}>공통</button>
        {exp.map((e, ri) => (
          <button key={ri} style={tabStyle(tabIdx === ri + 1)} onClick={() => setTabIdx(ri + 1)}>
            {e.id}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      <div style={{ padding: '8px 12px' }}>
        <textarea
          value={currentText}
          onChange={e => handleChange(e.target.value)}
          placeholder={
            tabIdx === 0
              ? '모든 실험 공통 기록 (반응 조건, 공통 절차 등)'
              : `${exp[tabIdx - 1]?.id} 개별 기록`
          }
          rows={3}
          style={{
            width: '100%',
            border: '0.5px solid #e2e4e9',
            background: '#f7f8fa',
            borderRadius: 5,
            resize: 'none',
            fontSize: 11,
            color: '#1a1c21',
            fontFamily: 'inherit',
            outline: 'none',
            lineHeight: 1.7,
            padding: '7px 10px',
            minHeight: 64,
          }}
          onFocus={e => { e.target.style.borderColor = '#1a6bb5'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = '#e2e4e9'; e.target.style.background = '#f7f8fa'; }}
        />
      </div>
    </div>
  );
};

export default RecordTabs;
