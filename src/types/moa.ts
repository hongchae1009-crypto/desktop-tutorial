// ============================================================
// Jinunote — 모아 실험 타입 정의
// ============================================================

// ── 기준물질 ──────────────────────────────────────────────
export type BaseTarget = 'exp' | `com-${number}`;

// ── 변수시약 행 ───────────────────────────────────────────
export interface Exp {
  id: string;           // 'HCE-1', 'HCE-2', ...
  name: string;         // 변수시약명
  pin: string;          // 시약 PIN 코드
  mw: number | null;    // 분자량 (g/mol)
  eq: number;           // eq 배율 (비기준 시약일 때)
  baseMmol: string;     // 기준물질일 때 직접 입력 mmol
  m: string;            // measures(mg) 실제 측정값
}

// ── 공통시약 열 ───────────────────────────────────────────
export interface Com {
  name: string;
  pin: string;
  mw: number | null;
  eq: number;           // eq 배율
  baseMmol: string;     // 기준물질일 때 직접 입력 mmol
  cells: ComCell[];     // 인덱스 = EXP 인덱스
}

export interface ComCell {
  m: string;            // measures(mg) 실제 측정값
}

// ── 실험결과 ──────────────────────────────────────────────
export interface ResData {
  cpd: Compound;
  yield: string;        // Yield %
  mg: string;           // 수득량(mg)
  pur: string;          // 순도 %
  meth: AnalysisMethod;
}

export interface Compound {
  name: string;
  pin: string;
  mw: number | null;
  registered: boolean;  // 시약장 등록 완료 여부
}

export type AnalysisMethod = '' | 'LCMS' | 'NMR' | 'HPLC' | 'GC';

// ── 첨부파일 ──────────────────────────────────────────────
export interface AttFile {
  name: string;
  dataUrl: string;
  type: 'image' | 'pdf' | 'other';
}

// ── 댓글 ──────────────────────────────────────────────────
export interface Comment {
  id: number;
  author: string;
  init: string;         // 아바타 이니셜
  color: string;
  bg: string;
  text: string;
  time: string;         // 'HH:MM'
}

// ── Undo 스냅샷 ───────────────────────────────────────────
export interface UndoSnapshot {
  desc: string;
  exp: Exp[];
  com: Com[];
  baseTarget: BaseTarget;
}

// ── 오차 계산 결과 ────────────────────────────────────────
export type DeviationBadge = 'ok' | 'warn' | 'err';

export interface DeviationResult {
  badge: DeviationBadge;
  label: string;        // '+1.3%'
  cellBg: string;       // '' | '#fff8ee' | '#fff0f0'
}

// ── 시약 (시약장) ─────────────────────────────────────────
export interface Reagent {
  name: string;
  pin: string;
  mw: number;
}

// ── 목록 카드 ─────────────────────────────────────────────
export type MoaStatus = 'draft' | 'active' | 'done';

export interface MoaCard {
  id: string;           // 'MB-PRI-HCE-2026-00001'
  title: string;        // 'HCE-260309'
  project: string;
  status: MoaStatus;
  expCount: number;
  bestYield: number | null;
  yieldHistory: Array<{ id: string; yield: number | null }>; // 미니 차트용
  author: string;
  createdAt: string;    // 'YYYY-MM-DD'
}

// ── 팔레트 ────────────────────────────────────────────────
export interface ColorPalette {
  bl: string;    // 기본 색상
  hBg: string;   // 헤더 배경
  hC: string;    // 헤더 텍스트
  kBg: string;   // 핵심값 배경
  kC: string;    // 핵심값 텍스트
  rBg: string;   // 참고값 배경
  rC: string;    // 참고값 텍스트
  dBg: string;   // 데이터 배경
}

// ── 시약 검색 모달 타겟 ───────────────────────────────────
export type ReagentModalTarget =
  | { kind: 'exp'; ri: number }
  | { kind: 'com'; ci: number };
