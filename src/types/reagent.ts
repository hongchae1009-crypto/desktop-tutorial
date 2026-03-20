// ─────────────────────────────────────────────────────────────
//  Jinunote · 시약장 (Reagent Cabinet) 타입 정의
//  모아실험(moa.ts)의 기존 타입과 충돌하지 않도록 별도 파일로 관리
// ─────────────────────────────────────────────────────────────

// ── 뷰 모드 ──────────────────────────────────────────────────
export type ViewMode = 'card' | 'table';

// ── 시약장 탭 ─────────────────────────────────────────────────
export interface Cabinet {
  id: string;
  name: string;
  /** 탭 구분 닷(●) 색상 hex */
  color: string;
  /** true = "자주쓰는 시약장" (고정 탭) */
  isFavorite: boolean;
  displayOrder: number;
  count: number;
}

// ── 시약 (Reagent) ────────────────────────────────────────────
export interface ReagentItem {
  id: string;            // UUID
  pinCode: string;       // "K01937" 형식
  customPin?: string;
  compoundName: string;
  alias?: string;
  smiles?: string;
  casNumber?: string;
  mw?: number;
  mp?: number;
  bp?: number;
  density?: number;
  purity?: number;
  location: string;
  quantity: number;
  unit: string;          // "g" | "mL" | "kg" | …
  supplier?: string;
  productNumber?: string;
  shopLink?: string;
  labNoteNumber?: string;
  notes?: string;
  msdsUrl?: string;
  qrUrl?: string;
  cabinetId: string;
  registeredBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── 장바구니 아이템 ───────────────────────────────────────────
export interface BasketItem {
  /** ReagentItem.id */
  id: string;
  pinCode: string;
  name: string;
  smiles?: string;
}

// ── 최근 검색 ─────────────────────────────────────────────────
export interface RecentSearch {
  keyword: string;
  searchedAt: Date;
}

// ── 최근 사용자 (모달용) ──────────────────────────────────────
export type RecentActionType =
  | 'edit_quantity'
  | 'view'
  | 'send_to_note'
  | 'register';

export interface RecentUser {
  userId: string;
  name: string;
  /** 아바타 이니셜 2자 */
  initials: string;
  /** 아바타 배경 hex */
  avatarColor: string;
  /** 아바타 텍스트 hex */
  textColor: string;
  actionType: RecentActionType;
  /** 화면에 표시할 액션 문자열 */
  actionLabel: string;
  actionAt: Date;
}

// ── 페이지네이션 메타 ─────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// ── 정렬 ─────────────────────────────────────────────────────
export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: keyof ReagentItem | '';
  dir: SortDir;
}

// ── QuantTable 컬럼 정의 ──────────────────────────────────────
/**
 * TABLE_HEADER colspan 검증 공식:
 *   Σ col.colSpan === QUANT_TABLE_COLUMN_COUNT (= 8)
 *
 * 헤더를 그룹화(colSpan > 1)할 경우에도 합계는 반드시 8이어야 한다.
 */
export const QUANT_TABLE_COLUMN_COUNT = 8 as const;

export interface QuantTableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** 기본값 1. 그룹 헤더일 때만 2 이상 지정. */
  colSpan: number;
  sortable?: boolean;
}
