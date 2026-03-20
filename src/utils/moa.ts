// ============================================================
// Jinunote — 모아 실험 핵심 계산 로직
// ============================================================

import type { BaseTarget, ColorPalette, DeviationResult, Exp, Com } from '../types/moa';

// ── 색상 팔레트 ───────────────────────────────────────────
export const CPAL: ColorPalette[] = [
  { bl: '#378ADD', hBg: '#ddeeff', hC: '#0a4a7a', kBg: '#e4f0ff', kC: '#185FA5', rBg: '#f3f8ff', rC: '#5a9fd4', dBg: '#f5faff' },
  { bl: '#1D9E75', hBg: '#ddf0e8', hC: '#0a4a2a', kBg: '#e2f7ee', kC: '#0F6E56', rBg: '#f2fcf7', rC: '#3aaa80', dBg: '#f4fdf8' },
  { bl: '#7F77DD', hBg: '#ede8ff', hC: '#3a1a7a', kBg: '#ece8ff', kC: '#534AB7', rBg: '#f8f6ff', rC: '#9990e0', dBg: '#f6f4ff' },
  { bl: '#EF9F27', hBg: '#fef0d8', hC: '#8a4f00', kBg: '#fef5e4', kC: '#9a5a00', rBg: '#fefaf3', rC: '#c4852a', dBg: '#fefcf5' },
  { bl: '#D85A30', hBg: '#faece7', hC: '#6b2010', kBg: '#fdf0eb', kC: '#993C1D', rBg: '#fef7f4', rC: '#c05535', dBg: '#fdf5f2' },
];

export const cp = (ci: number): ColorPalette => CPAL[ci % CPAL.length];

export const BARS = ['#378ADD', '#1D9E75', '#7F77DD', '#EF9F27', '#D85A30'];

// ── 샘플 시약 데이터 ──────────────────────────────────────
export const SAMPLE_REAGENTS = [
  { name: '1-Bromo-2-fluorobenzene',                     pin: 'K01251', mw: 175    },
  { name: '1-Bromo-2,4-dimethoxybenzene',                pin: 'K01275', mw: 217.06 },
  { name: '1-Bromo-2-(trifluoromethoxy)benzene',         pin: 'K01230', mw: 241.01 },
  { name: 'Piperazine',                                  pin: 'K00504', mw: 86.14  },
  { name: 'Ruphos',                                      pin: 'K00595', mw: 466.6  },
  { name: 'Sodium tert-butoxide',                        pin: 'K00622', mw: 96.1   },
  { name: 'Tris(dibenzylideneacetone)dipalladium(0)',    pin: 'K01055', mw: 915.7  },
  { name: '2-Bromopyridine',                             pin: 'K02011', mw: 158    },
  { name: '4-Bromoanisole',                              pin: 'K02088', mw: 187.04 },
];

// ── 기준물질 유틸 ─────────────────────────────────────────
export const isBaseE = (baseTarget: BaseTarget): boolean => baseTarget === 'exp';

export const isBaseCom = (ci: number, baseTarget: BaseTarget): boolean =>
  baseTarget === `com-${ci}`;

export function getBaseMmol(
  ri: number,
  baseTarget: BaseTarget,
  exp: Exp[],
  com: Com[],
): number {
  if (baseTarget === 'exp') return parseFloat(exp[ri].baseMmol) || 0;
  const ci = parseInt(baseTarget.replace('com-', ''));
  return parseFloat(com[ci]?.baseMmol) || 0;
}

// ── 자동 mmol 계산 ────────────────────────────────────────
// 비기준 시약: mmol = baseMmol × eq
export function autoMmol(baseMmol: number, eq: number): string | null {
  if (!baseMmol || !eq) return null;
  return (baseMmol * eq).toFixed(4);
}

// ── weight 계산 ───────────────────────────────────────────
// weight(mg) = mmol × MW
export function calcWeight(mmol: string | number | null, mw: number | null): string | null {
  const m = parseFloat(String(mmol));
  if (isNaN(m) || !mw) return null;
  return (m * mw).toFixed(2);
}

// ── 오차율 계산 ───────────────────────────────────────────
// 오차율(%) = (measures - planWeight) / planWeight × 100
export function getDeviation(
  planWeight: string | number | null,
  measures: string,
): DeviationResult | null {
  const p = parseFloat(String(planWeight));
  const m = parseFloat(measures);
  if (!measures || isNaN(m) || !planWeight || isNaN(p) || p === 0) return null;

  const r = (m - p) / p * 100;
  const label = (r >= 0 ? '+' : '') + r.toFixed(1) + '%';

  if (Math.abs(r) <= 5)  return { badge: 'ok',   label, cellBg: '' };
  if (Math.abs(r) <= 10) return { badge: 'warn', label, cellBg: '#fff8ee' };
  return                          { badge: 'err',  label, cellBg: '#fff0f0' };
}

// ── 실험결과 mmol 계산 ────────────────────────────────────
// mmol = 수득량(mg) / MW
export function calcResultMmol(mg: string, mw: number | null): string | null {
  const m = parseFloat(mg);
  if (!mg || isNaN(m) || m <= 0 || !mw) return null;
  return (m / mw).toFixed(4);
}

// ── colspan 계산 ──────────────────────────────────────────
export const eCs = (refOn: boolean): number => refOn ? 4 : 2;
export const cCs = (refOn: boolean): number => refOn ? 4 : 2;

/**
 * colspan 검증
 * h1 (1단 총 열) === b0 (바디 ri=0 td 수) 항상 성립
 *
 * h1 = 1 + (1+ec) + N×(1+cc)
 * b0 = 1 + 1 + ec + N×(1+cc)
 * bN = 1 + 1 + ec + N×cc        (ri>0, COM시약명 rowspan으로 없음)
 */
export function verifyColspan(refOn: boolean, comN: number): {
  h1: number; b0: number; bN: number; valid: boolean;
} {
  const ec = eCs(refOn), cc = cCs(refOn);
  const h1 = 1 + (1 + ec) + comN * (1 + cc);
  const b0 = 1 + 1 + ec + comN * (1 + cc);
  const bN = 1 + 1 + ec + comN * cc;
  return { h1, b0, bN, valid: h1 === b0 };
}

// ── 공통시약명 자동 네이밍 ────────────────────────────────
export function nextComName(comColIdx: number): string {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return 'Compound ' + (L[comColIdx] ?? `X${comColIdx}`);
}

// ── Yield 차트 계산 ───────────────────────────────────────
export function calcChartBars(yields: (number | null)[]): Array<{
  pct: number;
  isTop: boolean;
  color: string;
}> {
  const valid = yields.filter((v): v is number => v !== null && v > 0);
  const max = Math.max(...valid, 1);
  const bestIdx = yields.reduce<number>(
    (best, v, i) => (v !== null && (best === -1 || v > (yields[best] ?? 0)) ? i : best),
    -1,
  );
  return yields.map((v, i) => ({
    pct: v !== null && v > 0 ? Math.round(v / max * 100) : 0,
    isTop: i === bestIdx && v !== null && v > 0,
    color: i === bestIdx ? BARS[i % BARS.length] : '#c8d0dc',
  }));
}
