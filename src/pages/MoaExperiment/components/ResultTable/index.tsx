import React, { useRef } from 'react';
import type { AnalysisMethod, AttFile, Exp, ResData } from '../../../../types/moa';
import { calcResultMmol } from '../../../../utils/moa';

interface ResultTableProps {
  exp: Exp[];
  resData: ResData[];
  att: AttFile[][];
  getMmol: (ri: number) => string | null;
  onUpdateYield: (ri: number, v: string) => void;
  onUpdateMg: (ri: number, v: string) => void;
  onUpdatePur: (ri: number, v: string) => void;
  onUpdateMeth: (ri: number, v: AnalysisMethod) => void;
  onUpdateCpdName: (ri: number, v: string) => void;
  onOpenCpdSearch: (ri: number) => void;
  onOpenRegModal: (ri: number) => void;
  onAddFiles: (ri: number, files: AttFile[]) => void;
  onRemoveFile: (ri: number, fi: number) => void;
  onOpenPreview: (ri: number, fi: number) => void;
}

const SearchIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ResultTable: React.FC<ResultTableProps> = ({
  exp, resData, att, getMmol,
  onUpdateYield, onUpdateMg, onUpdatePur, onUpdateMeth,
  onUpdateCpdName, onOpenCpdSearch, onOpenRegModal,
  onAddFiles, onRemoveFile, onOpenPreview,
}) => {
  const thStyle: React.CSSProperties = {
    background: '#f7f8fa',
    padding: '5px 8px',
    borderBottom: '0.5px solid #d0d4dc',
    fontSize: 9,
    color: '#999',
    fontWeight: 500,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    border: '0.5px solid #d0d4dc',
  };
  const tdStyle: React.CSSProperties = {
    padding: '5px 8px',
    borderBottom: '0.5px solid #d0d4dc',
    verticalAlign: 'middle',
    fontSize: 10,
    border: '0.5px solid #d0d4dc',
  };
  const rinpStyle: React.CSSProperties = {
    padding: '3px 4px',
    border: '0.5px solid #d0d4dc',
    borderRadius: 3,
    background: 'transparent',
    color: '#1a1c21',
    fontSize: 10,
    textAlign: 'right' as const,
    fontFamily: 'inherit',
    outline: 'none',
  };

  const handleFileChange = (ri: number, files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        const type: AttFile['type'] = file.type.startsWith('image/')
          ? 'image'
          : file.type === 'application/pdf'
          ? 'pdf'
          : 'other';
        onAddFiles(ri, [{ name: file.name, dataUrl, type }]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, minWidth: 78 }}>실험번호</th>
            <th style={{ ...thStyle, minWidth: 168 }}>
              화합물명<br />
              <span style={{ fontSize: 8, opacity: 0.6, fontStyle: 'italic' }}>PIN · MW</span>
            </th>
            <th style={{ ...thStyle, minWidth: 60 }}>Yield %</th>
            <th style={{ ...thStyle, minWidth: 72 }}>수득량(mg)</th>
            <th style={{ ...thStyle, minWidth: 68, color: '#1a6bb5' }}>
              mmol<br />
              <span style={{ fontSize: 8, fontWeight: 400, fontStyle: 'italic', opacity: 0.7 }}>자동계산</span>
            </th>
            <th style={{ ...thStyle, minWidth: 58 }}>순도 %</th>
            <th style={{ ...thStyle, minWidth: 84 }}>분석 방법</th>
            <th style={{ ...thStyle, minWidth: 180 }}>첨부파일</th>
            <th style={{ ...thStyle, minWidth: 58, textAlign: 'center' }}>등록</th>
          </tr>
        </thead>
        <tbody>
          {exp.map((e, ri) => {
            const d = resData[ri] ?? { cpd: { name: '', pin: '', mw: null, registered: false }, yield: '', mg: '', pur: '', meth: '' as AnalysisMethod };
            const mmol = getMmol(ri);
            const files = att[ri] ?? [];

            return (
              <tr key={ri}>
                {/* 실험번호 */}
                <td style={tdStyle}>
                  <span style={{ fontSize: 10, fontWeight: 500 }}>{e.id}</span>
                </td>

                {/* 화합물명 */}
                <td style={{ ...tdStyle, padding: '4px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: 10, fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120,
                        ...(d.cpd.name ? {} : { color: '#bbb', fontStyle: 'italic', fontWeight: 400 }),
                      }}>
                        {d.cpd.name || '검색 또는 직접 입력'}
                      </div>
                      {(d.cpd.pin || d.cpd.mw) && (
                        <div style={{ fontSize: 8, color: '#bbb', fontFamily: 'monospace', marginTop: 1 }}>
                          {d.cpd.pin ? d.cpd.pin + ' · ' : ''}{d.cpd.mw ? 'MW ' + d.cpd.mw : ''}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onOpenCpdSearch(ri)}
                      title="시약장 검색"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 16, height: 16, borderRadius: 3, border: '0.5px solid #d0d4dc',
                        background: '#f7f8fa', cursor: 'pointer', color: '#888', flexShrink: 0,
                      }}
                    >
                      <SearchIcon />
                    </button>
                    {d.cpd.registered && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 8,
                        padding: '1px 5px', borderRadius: 3, background: '#e2f7ee',
                        color: '#1D9E75', border: '0.5px solid #9FE1CB',
                      }}>
                        ✓ 등록됨
                      </span>
                    )}
                  </div>
                  {!d.cpd.name && (
                    <input
                      placeholder="직접 입력..."
                      onChange={e => onUpdateCpdName(ri, e.target.value)}
                      style={{ ...rinpStyle, width: '100%', marginTop: 3, textAlign: 'left' }}
                    />
                  )}
                </td>

                {/* Yield % */}
                <td style={tdStyle}>
                  <input
                    value={d.yield}
                    placeholder="%"
                    onChange={e => onUpdateYield(ri, e.target.value)}
                    style={{ ...rinpStyle, width: 54 }}
                  />
                </td>

                {/* 수득량 */}
                <td style={tdStyle}>
                  <input
                    value={d.mg}
                    placeholder="mg"
                    onChange={e => onUpdateMg(ri, e.target.value)}
                    style={{ ...rinpStyle, width: 64 }}
                  />
                </td>

                {/* mmol 자동계산 */}
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <span style={{
                    fontSize: 10,
                    color: mmol ? '#1a6bb5' : '#4a5060',
                    fontWeight: mmol ? 500 : 400,
                  }}>
                    {mmol ?? (
                      <>
                        —
                        {!d.cpd.mw && (
                          <span style={{ fontSize: 8, color: '#bbb', display: 'block' }}>MW 필요</span>
                        )}
                      </>
                    )}
                  </span>
                </td>

                {/* 순도 */}
                <td style={tdStyle}>
                  <input
                    value={d.pur}
                    placeholder="%"
                    onChange={e => onUpdatePur(ri, e.target.value)}
                    style={{ ...rinpStyle, width: 50 }}
                  />
                </td>

                {/* 분석방법 */}
                <td style={tdStyle}>
                  <select
                    value={d.meth}
                    onChange={e => onUpdateMeth(ri, e.target.value as AnalysisMethod)}
                    style={{
                      padding: '3px 4px', border: '0.5px solid #d0d4dc', borderRadius: 3,
                      background: 'transparent', color: '#1a1c21', fontSize: 10,
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  >
                    <option value="">—</option>
                    <option value="LCMS">LCMS</option>
                    <option value="NMR">NMR</option>
                    <option value="HPLC">HPLC</option>
                    <option value="GC">GC</option>
                  </select>
                </td>

                {/* 첨부파일 */}
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                      {files.map((f, fi) => (
                        <span
                          key={fi}
                          onClick={() => onOpenPreview(ri, fi)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9,
                            padding: '2px 7px', borderRadius: 3, background: '#e8f0fa',
                            color: '#1a6bb5', border: '0.5px solid #b5d4f4', cursor: 'pointer',
                            maxWidth: 160,
                          }}
                        >
                          {f.type === 'image' && f.dataUrl && (
                            <img src={f.dataUrl} alt={f.name} style={{ width: 14, height: 14, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{f.name}</span>
                          <span
                            onClick={ev => { ev.stopPropagation(); onRemoveFile(ri, fi); }}
                            style={{ cursor: 'pointer', color: '#888', marginLeft: 1 }}
                          >
                            ×
                          </span>
                        </span>
                      ))}
                    </div>
                    <label style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9,
                      padding: '2px 7px', borderRadius: 4, border: '0.5px solid #e2e4e9',
                      background: '#f7f8fa', color: '#4a5060', cursor: 'pointer', marginTop: 3,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      파일 추가
                      <input
                        type="file"
                        style={{ display: 'none' }}
                        multiple
                        accept="image/*,.pdf"
                        onChange={e => handleFileChange(ri, e.target.files)}
                      />
                    </label>
                  </div>
                </td>

                {/* 등록 */}
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {d.cpd.registered ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 8,
                      padding: '1px 5px', borderRadius: 3, background: '#e2f7ee',
                      color: '#1D9E75', border: '0.5px solid #9FE1CB',
                    }}>
                      ✓ 등록됨
                    </span>
                  ) : (
                    <button
                      onClick={() => onOpenRegModal(ri)}
                      style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 5,
                        border: '0.5px solid #9FE1CB', background: '#f0fdf8',
                        color: '#1D9E75', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="2" width="12" height="12" rx="2" stroke="#1D9E75" strokeWidth="1.3" />
                        <path d="M8 5v6M5 8h6" stroke="#1D9E75" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      등록
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResultTable;
