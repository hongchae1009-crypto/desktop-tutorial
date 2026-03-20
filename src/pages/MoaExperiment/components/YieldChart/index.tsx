import React from 'react';
import type { Exp } from '../../../../types/moa';
import { calcChartBars } from '../../../../utils/moa';

interface YieldChartProps {
  exp: Exp[];
  yields: (number | null)[];
}

const YieldChart: React.FC<YieldChartProps> = ({ exp, yields }) => {
  const bars = calcChartBars(yields);
  const bestIdx = bars.findIndex(b => b.isTop);
  const bestYield = bestIdx >= 0 ? yields[bestIdx] : null;

  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ fontSize: 9, color: '#9099aa', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>
        Yield 비교
      </div>

      {bars.map((b, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <div style={{ fontSize: 9, width: 42, flexShrink: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', color: '#555' }}>
            {exp[i]?.id ?? `#${i + 1}`}
          </div>
          <div style={{ flex: 1, height: 12, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${b.pct}%`,
              background: b.color,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ fontSize: 9, color: '#999', width: 30, textAlign: 'right', flexShrink: 0 }}>
            {yields[i] !== null ? `${yields[i]}%` : '—'}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 6, paddingTop: 7, borderTop: '0.5px solid #e2e4e9' }}>
        <div style={{ fontSize: 9, color: '#9099aa', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          최고 yield
        </div>
        <div style={{ fontSize: 11, color: bestYield !== null ? '#1D9E75' : '#9099aa', marginTop: 4 }}>
          {bestYield !== null
            ? `${exp[bestIdx]?.id ?? ''} — ${bestYield}%`
            : '—'
          }
        </div>
      </div>
    </div>
  );
};

export default YieldChart;
