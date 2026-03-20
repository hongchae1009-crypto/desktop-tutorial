/**
 * 장바구니 전역 상태 (Zustand)
 *
 * ⚠️ 상태 유지 규칙 (FR-20):
 *   - 페이지네이션 이동   → 유지
 *   - 시약 검색 변경      → 유지
 *   - 시약장 탭 전환      → 유지
 *   - 카드 ↔ 테이블 전환  → 유지
 *   - 개별 ✕ 클릭         → 해당 항목만 제거
 *   - "전체 해제" 클릭    → 전체 초기화
 *   - API 완료 후          → 초기화 (add/sendToNote)
 */
import { create } from 'zustand';
import type { BasketItem } from '@/types/reagent';

interface BasketState {
  /** { [reagentId]: BasketItem } */
  items: Record<string, BasketItem>;
  add: (item: BasketItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  count: () => number;
}

export const useBasketStore = create<BasketState>((set, get) => ({
  items: {},

  add: (item) =>
    set((s) => ({ items: { ...s.items, [item.id]: item } })),

  remove: (id) =>
    set((s) => {
      const next = { ...s.items };
      delete next[id];
      return { items: next };
    }),

  clear: () => set({ items: {} }),

  has: (id) => id in get().items,

  count: () => Object.keys(get().items).length,
}));
