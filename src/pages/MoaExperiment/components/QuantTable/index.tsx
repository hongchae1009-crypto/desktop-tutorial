import React, { useEffect } from 'react';
import type { BaseTarget, Exp, Com } from '../../../../types/moa';
import {
  cp,
  eCs,
  cCs,
  verifyColspan,
  isBaseE,
  isBaseCom,
  getBaseMmol,
  autoMmol,
  calcWeight,
  getDeviation,
} from '../../../../utils/moa';

// ── DeviationBadge 컴포넌트 ───────────────────────────────
const DevBadge: React.FC<{ badge: 'ok' | 'warn' | 'err'; label: string }> = ({ badge, label }) => {
  const s: React.CSSProperties =
    badge === 'ok'
      ? { fontSize: 8, padding: '1px 3px', borderRadius: 2, background: '#eaf3de', color: '#3B6D11', marginLeft: 2 }
      : badge === 'warn'
      ? { fontSize: 8, padding: '1px 3px', borderRadius: 2, background: '#faeeda', color: '#633806', marginLeft: 2 }
      : { fontSize: 8, padding: '1px 3px', borderRadius: 2, background: '#fcebeb', color: '#A32D2D', marginLeft: 2 };
  return <span style={s}>{label}</span>;
};

// ── 검색 아이콘 ───────────────────────────────────────────
const SearchIcon: React.FC = () => (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ── Props ─────────────────────────────────────────────────
interface QuantTableProps {
  exp: Exp[];
  com: Com[];
  baseTarget: BaseTarget;
  refOn: boolean;
  onSetBase: (t: BaseTarget) => void;
  onUpdateExpField: <K extends keyof Exp>(ri: number, field: K, value: Exp[K]) => void;
  onUpdateExpMeasure: (ri: number, value: string) => void;
  onUpdateComCell: (ci: number, ri: number, value: string) => void;
  onUpdateComField: <K extends keyof Com>(ci: number, field: K, value: Com[K]) => void;
  onDelExpRow: (ri: number) => void;
  onDelComCol: (ci: number) => void;
  onOpenReagentModal: (target: { kind: 'exp'; ri: number } | { kind: 'com'; ci: number }) => void;
}

const QuantTable: React.FC<QuantTableProps> = ({
  exp, com, baseTarget, refOn,
  onSetBase,
  onUpdateExpField, onUpdateExpMeasure,
  onUpdateComCell, onUpdateComField,
  onDelExpRow, onDelComCol,
  onOpenReagentModal,
}) => {
  // ── colspan 검증 ─────────────────────────────────────────
  // TABLE_HEADER.md 공식:
  //   ec = refOn ? 4 : 2
  //   cc = refOn ? 4 : 2
  //   h1 = 1 + (1+ec) + comN×(1+cc)   ← 1단 총 열 수
  //   b0 = 1 + 1 + ec + comN×(1+cc)   ← 바디 ri=0 td 수
  //   h1 === b0  항상 성립
  useEffect(() => {
    const { h1, b0, bN, valid } = verifyColspan(refOn, com.length);
    if (!valid) {
      console.error(`[QuantTable] colspan 검증 실패! h1=${h1} b0=${b0} bN=${bN}`);
    }
  }, [refOn, com.length]);

  const ec = eCs(refOn);
  const cc = cCs(refOn);
  const N = exp.length;

  // ── 기준물질 배너 텍스트 ────────────────────────────────
  const bannerText = isBaseE(baseTarget)
    ? '기준물질: 변수시약 E — 각 실험별 mmol 직접 입력 · eq = 1 고정 · 공통시약은 eq로 자동계산'
    : (() => {
        const ci = parseInt(baseTarget.replace('com-', ''));
        const c = com[ci];
        return c
          ? `기준물질: ${c.name} (${c.pin}) — mmol 입력 · eq = 1 고정 · 다른 시약은 eq로 자동계산`
          : '';
      })();

  // ── 셀 스타일 헬퍼 ──────────────────────────────────────
  const thBase: React.CSSProperties = {
    border: '0.5px solid #d0d4dc',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };
  const tdBase: React.CSSProperties = {
    border: '0.5px solid #d0d4dc',
    padding: '3px 5px',
    verticalAlign: 'middle',
    fontSize: 10,
    whiteSpace: 'nowrap',
  };
  const inputBase: React.CSSProperties = {
    padding: '2px 4px',
    border: '0.5px solid #d0d4dc',
    borderRadius: 3,
    background: 'transparent',
    color: '#1a1c21',
    fontSize: 10,
    textAlign: 'right' as const,
    fontFamily: 'inherit',
    outline: 'none',
  };

  // ── 헤더 렌더 ─────────────────────────────────────────────
  // 구조 (TABLE_HEADER.md 기준):
  //
  // 1단: 실험번호(rowspan=2) | ○변수시약(1열) | E정량그룹(colspan=ec) | [○시약명🔍×(1열) | COM정량그룹(colspan=cc)] × comN
  // 2단:                      E시약명(1열) | [eq mmol if refOn] weight measure | [COM시약명(1열) | [eq mmol if refOn] weight measure] × comN
  //
  // h1 = 1 + (1+ec) + comN*(1+cc)   ← 1단 총 열
  // 2단 합계 = (1+ec) + comN*(1+cc) = h1-1 (실험번호 rowspan=2로 없음) ✓

  const renderHeader = () => {
    const orangeHBg = '#fef0d8';
    const orangeHC = '#8a4f00';
    const orangeKBg = '#fef5e4';
    const orangeKC = '#9a5a00';
    const orangeRBg = '#fef5e4';
    const orangeBl = '#EF9F27';

    return (
      <thead>
        {/* ── 1단 ── */}
        <tr>
          {/* 실험번호 (rowspan=2) */}
          <th
            rowSpan={2}
            style={{
              ...thBase,
              background: '#f2f3f5',
              color: '#555',
              fontSize: 9,
              fontWeight: 500,
              textAlign: 'center',
              padding: '5px 6px',
              minWidth: 82,
            }}
          >
            실험번호
          </th>

          {/* E 라디오+텍스트 (1열) */}
          <th
            style={{
              ...thBase,
              background: orangeHBg,
              color: orangeHC,
              fontSize: 9,
              fontWeight: 500,
              padding: '4px 8px',
              minWidth: 188,
              borderLeft: `2.5px solid ${orangeBl}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <input
                type="radio"
                name="base-radio"
                value="exp"
                checked={isBaseE(baseTarget)}
                onChange={() => onSetBase('exp')}
                style={{ width: 13, height: 13, cursor: 'pointer', accentColor: '#1a6bb5', flexShrink: 0 }}
              />
              <span style={{ fontSize: 9, fontWeight: 500 }}>
                변수시약
                {isBaseE(baseTarget) && (
                  <span style={{
                    fontSize: 8, background: '#e8f0fa', color: '#1a6bb5',
                    padding: '1px 4px', borderRadius: 3, border: '0.5px solid #b5d4f4',
                    fontWeight: 500, marginLeft: 4,
                  }}>기준</span>
                )}
              </span>
            </div>
          </th>

          {/* E 정량 그룹 (colspan=ec) */}
          <th
            colSpan={ec}
            style={{
              ...thBase,
              background: orangeHBg,
              color: orangeHC,
              fontSize: 9,
              fontWeight: 500,
              textAlign: 'center',
              padding: '4px 6px',
            }}
          >
            변수시약
          </th>

          {/* COM 그룹 × N */}
          {com.map((c, ci) => {
            const pl = cp(ci);
            return (
              <React.Fragment key={ci}>
                {/* COM 라디오+시약명+돋보기+삭제 (1열) */}
                <th
                  style={{
                    ...thBase,
                    background: pl.hBg,
                    color: pl.hC,
                    fontSize: 9,
                    fontWeight: 500,
                    padding: '3px 8px',
                    minWidth: 178,
                    borderLeft: `2.5px solid ${pl.bl}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <input
                      type="radio"
                      name="base-radio"
                      value={`com-${ci}`}
                      checked={isBaseCom(ci, baseTarget)}
                      onChange={() => onSetBase(`com-${ci}` as BaseTarget)}
                      style={{ width: 13, height: 13, cursor: 'pointer', accentColor: '#1a6bb5', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span>{c.name || '시약명'}</span>
                        <button
                          onClick={() => onOpenReagentModal({ kind: 'com', ci })}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 16, height: 16, borderRadius: 3, border: `0.5px solid ${pl.bl}`,
                            background: '#f7f8fa', cursor: 'pointer', color: '#888', flexShrink: 0,
                          }}
                        >
                          <SearchIcon />
                        </button>
                        <button
                          onClick={() => onDelComCol(ci)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 12, height: 12, borderRadius: '50%', background: '#fee2e2',
                            border: '0.5px solid #fca5a5', color: '#c0392b', fontSize: 8, cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                        {isBaseCom(ci, baseTarget) && (
                          <span style={{
                            fontSize: 8, background: '#e8f0fa', color: '#1a6bb5',
                            padding: '1px 4px', borderRadius: 3, border: '0.5px solid #b5d4f4',
                          }}>기준</span>
                        )}
                      </div>
                    </div>
                  </div>
                </th>

                {/* COM 정량 그룹 (colspan=cc) */}
                <th
                  colSpan={cc}
                  style={{
                    ...thBase,
                    background: pl.hBg,
                    color: pl.hC,
                    fontSize: 9,
                    fontWeight: 500,
                    textAlign: 'center',
                    padding: '3px 6px',
                  }}
                >
                  {c.name || '시약명'}
                  <br />
                  <span style={{ fontSize: 8, opacity: 0.6, fontStyle: 'italic', fontWeight: 400 }}>
                    {c.pin} · MW {c.mw}
                  </span>
                </th>
              </React.Fragment>
            );
          })}
        </tr>

        {/* ── 2단 ── */}
        {/* 실험번호 셀 생략 (rowspan=2) */}
        <tr>
          {/* E 시약명 (1열) */}
          <th
            style={{
              ...thBase,
              background: orangeRBg,
              color: orangeHC,
              fontSize: 9,
              fontWeight: 400,
              padding: '3px 8px',
              minWidth: 188,
              borderLeft: `2.5px solid ${orangeBl}`,
              textAlign: 'left',
            }}
          >
            <span style={{ fontWeight: 500 }}>
              {exp.length > 0 && exp[0].name ? exp[0].name : '시약명'}
            </span>
            <br />
            <span style={{ fontSize: 8, opacity: 0.6, fontStyle: 'italic' }}>PIN MW</span>
          </th>

          {/* E eq (refOn=ON 시만) */}
          {refOn && (
            <th style={{
              ...thBase,
              background: orangeRBg, color: orangeKC,
              fontSize: 8, fontStyle: 'italic', textAlign: 'center', padding: '3px 4px', minWidth: 38,
            }}>
              eq
            </th>
          )}
          {/* E mmol (refOn=ON 시만) */}
          {refOn && (
            <th style={{
              ...thBase,
              background: orangeRBg, color: orangeKC,
              fontSize: 9, fontWeight: 500, textAlign: 'center', padding: '3px 5px', minWidth: 66,
            }}>
              mmol
            </th>
          )}
          {/* E weight */}
          <th style={{
            ...thBase,
            background: orangeKBg, color: orangeKC,
            fontSize: 9, fontWeight: 500, textAlign: 'center', padding: '3px 5px', minWidth: 68,
          }}>
            weight(mg)
          </th>
          {/* E measure */}
          <th style={{
            ...thBase,
            background: orangeKBg, color: orangeKC,
            fontSize: 9, fontWeight: 500, textAlign: 'center', padding: '3px 5px', minWidth: 72,
          }}>
            measure(mg)
          </th>

          {/* COM 서브 × N */}
          {com.map((c, ci) => {
            const pl = cp(ci);
            return (
              <React.Fragment key={ci}>
                {/* COM 시약명 (1열) */}
                <th
                  style={{
                    ...thBase,
                    background: pl.rBg,
                    color: pl.hC,
                    fontSize: 9,
                    fontWeight: 400,
                    padding: '3px 8px',
                    minWidth: 178,
                    borderLeft: `2.5px solid ${pl.bl}`,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{c.name || '시약명'}</span>
                  <br />
                  <span style={{ fontSize: 8, opacity: 0.6, fontStyle: 'italic' }}>
                    {c.pin} · MW {c.mw}
                  </span>
                </th>

                {/* COM eq (refOn=ON 시만) */}
                {refOn && (
                  <th style={{
                    ...thBase,
                    background: pl.rBg, color: pl.rC,
                    fontSize: 8, fontStyle: 'italic', textAlign: 'center', padding: '3px 4px', minWidth: 38,
                  }}>
                    eq
                  </th>
                )}
                {/* COM mmol (refOn=ON 시만) */}
                {refOn && (
                  <th style={{
                    ...thBase,
                    background: pl.rBg, color: pl.rC,
                    fontSize: 9, fontWeight: 500, textAlign: 'center', padding: '3px 4px', minWidth: 66,
                  }}>
                    mmol
                  </th>
                )}
                {/* COM weight */}
                <th style={{
                  ...thBase,
                  background: pl.kBg, color: pl.kC,
                  fontSize: 9, fontWeight: 500, textAlign: 'center', padding: '3px 5px', minWidth: 68,
                }}>
                  weight(mg)
                </th>
                {/* COM measure */}
                <th style={{
                  ...thBase,
                  background: pl.kBg, color: pl.kC,
                  fontSize: 9, fontWeight: 500, textAlign: 'center', padding: '3px 5px', minWidth: 72,
                }}>
                  measure(mg)
                </th>
              </React.Fragment>
            );
          })}
        </tr>
      </thead>
    );
  };

  // ── 바디 렌더 ─────────────────────────────────────────────
  // ri=0: 실험번호 | E시약명+돋보기 | [eq] [mmol] weight measure | COM시약명(rowspan=N) [eq] [mmol] weight measure × comN
  //       → b0 = 1 + 1 + ec + comN×(1+cc) = h1 ✓
  // ri>0: 실험번호 | E시약명+돋보기 | [eq] [mmol] weight measure | [eq] [mmol] weight measure × comN
  //       → bN = 1 + 1 + ec + comN×cc

  const renderBody = () => {
    const orangeRBg = '#fffcf4';
    const orangeBl = '#EF9F27';

    return (
      <tbody>
        {exp.map((d, ri) => {
          const base = getBaseMmol(ri, baseTarget, exp, com);
          const isBase = isBaseE(baseTarget);

          // E 계산
          const eMmol = isBase
            ? (parseFloat(d.baseMmol) || 0)
            : (parseFloat(autoMmol(base, d.eq) ?? '0') || 0);
          const eWeight = calcWeight(eMmol, d.mw);
          const eDev = getDeviation(eWeight, d.m);

          const measureCellBg = eDev ? eDev.cellBg || orangeRBg : orangeRBg;

          return (
            <tr key={ri}>
              {/* 실험번호 셀 */}
              <td
                style={{
                  ...tdBase,
                  position: 'relative',
                  textAlign: 'center',
                  background: '#f7f8fa',
                  padding: '4px 6px',
                }}
              >
                <button
                  onClick={() => onDelExpRow(ri)}
                  style={{
                    display: 'none', // CSS :hover → tr:hover .del-row-btn (인라인 대신 CSS 클래스 권장)
                    position: 'absolute', top: '50%', right: 2, transform: 'translateY(-50%)',
                    width: 14, height: 14, borderRadius: '50%', background: '#fee2e2',
                    border: '0.5px solid #fca5a5', color: '#c0392b', fontSize: 9, cursor: 'pointer',
                    alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1, zIndex: 1,
                  }}
                  className="del-row-btn"
                >
                  ×
                </button>
                <input
                  className="inp inp-id"
                  value={d.id}
                  onChange={e => onUpdateExpField(ri, 'id', e.target.value)}
                  style={{ ...inputBase, width: 56, textAlign: 'center', fontWeight: 500 }}
                />
              </td>

              {/* E 시약명 + 돋보기 */}
              <td style={{
                ...tdBase,
                background: isBase ? '#fffdf5' : orangeRBg,
                padding: '4px 8px',
                borderLeft: `2.5px solid ${orangeBl}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 500,
                      ...(d.name ? {} : { color: '#bbb', fontStyle: 'italic', fontWeight: 400 }),
                      display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {d.name || '시약 검색...'}
                    </span>
                    {d.pin
                      ? <span style={{ fontSize: 8, color: '#bbb', fontFamily: 'monospace', marginTop: 1, display: 'block' }}>{d.pin} · MW {d.mw}</span>
                      : <span style={{ fontSize: 8, color: '#ddd', fontFamily: 'monospace', marginTop: 1, display: 'block' }}>PIN MW</span>
                    }
                  </div>
                  <button
                    onClick={() => onOpenReagentModal({ kind: 'exp', ri })}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 16, height: 16, borderRadius: 3, border: '0.5px solid #d0d4dc',
                      background: '#f7f8fa', cursor: 'pointer', color: '#888', flexShrink: 0,
                    }}
                  >
                    <SearchIcon />
                  </button>
                </div>
              </td>

              {/* E eq (refOn=ON) */}
              {refOn && (
                isBase
                  ? <td style={{ ...tdBase, background: '#fffef9', textAlign: 'center' }}>
                      <span style={{ color: '#bbb', fontSize: 10, fontStyle: 'italic' }}>1.00</span>
                    </td>
                  : <td style={{ ...tdBase, background: '#fffef9', textAlign: 'right' }}>
                      <input
                        value={String(d.eq || '')}
                        onChange={e => onUpdateExpField(ri, 'eq', parseFloat(e.target.value) || 0)}
                        style={{ ...inputBase, width: 40 }}
                      />
                    </td>
              )}

              {/* E mmol (refOn=ON) */}
              {refOn && (
                isBase
                  ? <td style={{ ...tdBase, background: '#fff8f0', textAlign: 'right', border: `0.5px solid ${orangeBl}` }}>
                      <input
                        value={d.baseMmol}
                        placeholder="기준 mmol"
                        onChange={e => onUpdateExpField(ri, 'baseMmol', e.target.value)}
                        style={{ ...inputBase, width: 62, borderColor: orangeBl, background: '#fffdf8' }}
                      />
                    </td>
                  : <td style={{ ...tdBase, background: '#fffef9', textAlign: 'right' }}>
                      <span style={{ color: '#4a5060', fontSize: 10 }}>
                        {eMmol || '—'}
                      </span>
                    </td>
              )}

              {/* E weight */}
              <td style={{ ...tdBase, background: orangeRBg, textAlign: 'right' }}>
                <span style={{ color: '#4a5060', fontSize: 10 }}>{eWeight ?? '—'}</span>
              </td>

              {/* E measure */}
              <td style={{ ...tdBase, background: measureCellBg, textAlign: 'right' }}>
                <input
                  value={d.m}
                  onChange={e => onUpdateExpMeasure(ri, e.target.value)}
                  style={{ ...inputBase, width: 66, fontSize: 11, fontWeight: 500 }}
                />
                {eDev && <DevBadge badge={eDev.badge} label={eDev.label} />}
              </td>

              {/* COM 그룹 */}
              {com.map((c, ci) => {
                const pl = cp(ci);
                const cell = c.cells[ri] ?? { m: '' };
                const isBCom = isBaseCom(ci, baseTarget);
                const cMmolStr = isBCom
                  ? String(c.baseMmol || '')
                  : (autoMmol(base, c.eq) ?? '');
                const cWeight = calcWeight(cMmolStr, c.mw);
                const cDev = getDeviation(cWeight, cell.m);
                const cMeasureBg = cDev ? cDev.cellBg || pl.dBg : pl.dBg;
                const bl = `2.5px solid ${pl.bl}`;

                return (
                  <React.Fragment key={ci}>
                    {/* COM 시약명 — ri===0 일 때만 렌더, rowspan=N (TABLE_HEADER.md 기준) */}
                    {ri === 0 && (
                      <td
                        rowSpan={N}
                        style={{
                          ...tdBase,
                          background: pl.rBg,
                          padding: '4px 8px',
                          borderLeft: bl,
                          verticalAlign: 'middle',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <span style={{ fontSize: 10, fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.name}
                            </span>
                            <span style={{ fontSize: 8, color: '#bbb', fontFamily: 'monospace', marginTop: 1, display: 'block' }}>
                              {c.pin} · MW {c.mw}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* COM eq (refOn=ON) */}
                    {refOn && (
                      isBCom
                        ? <td style={{ ...tdBase, background: pl.rBg, textAlign: 'center' }}>
                            <span style={{ color: '#bbb', fontSize: 10, fontStyle: 'italic' }}>1.00</span>
                          </td>
                        : <td style={{ ...tdBase, background: pl.rBg, textAlign: 'right' }}>
                            <input
                              value={String(c.eq || '')}
                              onChange={e => onUpdateComField(ci, 'eq', parseFloat(e.target.value) || 0)}
                              style={{ ...inputBase, width: 40, color: pl.rC }}
                            />
                          </td>
                    )}

                    {/* COM mmol (refOn=ON) */}
                    {refOn && (
                      isBCom
                        ? <td style={{ ...tdBase, background: pl.rBg, textAlign: 'right', border: `0.5px solid ${pl.bl}` }}>
                            <input
                              value={String(c.baseMmol || '')}
                              placeholder="기준 mmol"
                              onChange={e => onUpdateComField(ci, 'baseMmol', e.target.value)}
                              style={{ ...inputBase, width: 62, borderColor: pl.bl }}
                            />
                          </td>
                        : <td style={{ ...tdBase, background: pl.rBg, textAlign: 'right', color: pl.rC }}>
                            {cMmolStr || '—'}
                          </td>
                    )}

                    {/* COM weight */}
                    <td style={{ ...tdBase, background: pl.dBg, textAlign: 'right' }}>
                      <span style={{ color: '#4a5060', fontSize: 10 }}>{cWeight ?? '—'}</span>
                    </td>

                    {/* COM measure */}
                    <td style={{ ...tdBase, background: cMeasureBg, textAlign: 'right' }}>
                      <input
                        value={cell.m}
                        onChange={e => onUpdateComCell(ci, ri, e.target.value)}
                        style={{ ...inputBase, width: 66, fontSize: 11, fontWeight: 500 }}
                      />
                      {cDev && <DevBadge badge={cDev.badge} label={cDev.label} />}
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    );
  };

  return (
    <>
      {/* 기준물질 배너 */}
      <div style={{
        background: '#fff', border: '0.5px solid #b5d4f4', borderRadius: 8,
        padding: '7px 14px', fontSize: 11, display: 'flex', alignItems: 'center',
        gap: 8, flexShrink: 0, marginBottom: 8,
      }}>
        <span style={{ fontSize: 14 }}>⭐</span>
        <span style={{ color: '#4a5060' }}>{bannerText}</span>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 10, whiteSpace: 'nowrap' }}>
          {renderHeader()}
          {renderBody()}
        </table>
      </div>
    </>
  );
};

export default QuantTable;
