// ============================================================
// Jinunote — 모아 실험 핵심 계산 로직
// ============================================================

import type { BaseTarget, Exp, Com, DeviationResult } from './types';

// ── 색상 팔레트 ───────────────────────────────────────────
export const CPAL = [
  { bl:'#378ADD', hBg:'#ddeeff', hC:'#0a4a7a', kBg:'#e4f0ff', kC:'#185FA5', rBg:'#f3f8ff', rC:'#5a9fd4', dBg:'#f5faff' },
  { bl:'#1D9E75', hBg:'#ddf0e8', hC:'#0a4a2a', kBg:'#e2f7ee', kC:'#0F6E56', rBg:'#f2fcf7', rC:'#3aaa80', dBg:'#f4fdf8' },
  { bl:'#7F77DD', hBg:'#ede8ff', hC:'#3a1a7a', kBg:'#ece8ff', kC:'#534AB7', rBg:'#f8f6ff', rC:'#9990e0', dBg:'#f6f4ff' },
  { bl:'#EF9F27', hBg:'#fef0d8', hC:'#8a4f00', kBg:'#fef5e4', kC:'#9a5a00', rBg:'#fefaf3', rC:'#c4852a', dBg:'#fefcf5' },
  { bl:'#D85A30', hBg:'#faece7', hC:'#6b2010', kBg:'#fdf0eb', kC:'#993C1D', rBg:'#fef7f4', rC:'#c05535', dBg:'#fdf5f2' },
] as const;

export const cp = (ci: number) => CPAL[ci % CPAL.length];

export const BARS = ['#378ADD', '#1D9E75', '#7F77DD', '#EF9F27', '#D85A30'];

// ── 기준물질 mmol 가져오기 ────────────────────────────────
export function getBaseMmol(
  ri: number,
  baseTarget: BaseTarget,
  exp: Exp[],
  com: Com[]
): number {
  if (baseTarget === 'exp') return parseFloat(exp[ri].baseMmol) || 0;
  const ci = parseInt(baseTarget.replace('com-', ''));
  return parseFloat(com[ci]?.baseMmol) || 0;
}

export const isBaseE = (baseTarget: BaseTarget) => baseTarget === 'exp';
export const isBaseCom = (ci: number, baseTarget: BaseTarget) =>
  baseTarget === `com-${ci}`;

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
  measures: string
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
export const eCs = (refOn: boolean) => refOn ? 4 : 2;
export const cCs = (refOn: boolean) => refOn ? 4 : 2;

/**
 * colspan 검증
 * h1 (1단 총 열) === b0 (바디 ri=0 td 수) 항상 성립
 *
 * h1 = 1 + (1+ec) + N×(1+cc)
 * b0 = 1 + 1 + ec + N×(1+cc)
 * bN = 1 + 1 + ec + N×cc        (ri>0, COM시약명 rowspan으로 없음)
 */
export function verifyColspan(refOn: boolean, comN: number) {
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
export function calcChartBars(yields: (number | null)[]) {
  const valid = yields.filter((v): v is number => v !== null && v > 0);
  const max = Math.max(...valid, 1);
  const bestIdx = yields.reduce(
    (best, v, i) => (v !== null && (best === -1 || v > (yields[best] ?? 0)) ? i : best),
    -1
  );
  return yields.map((v, i) => ({
    pct: v !== null && v > 0 ? Math.round(v / max * 100) : 0,
    isTop: i === bestIdx && v !== null && v > 0,
    color: i === bestIdx ? BARS[i % BARS.length] : '#c8d0dc',
  }));
}
