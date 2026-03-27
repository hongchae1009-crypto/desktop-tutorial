/**
 * Supabase DB row 타입 정의
 */
import type { MoaCard, MoaStatus, Exp, Com, BaseTarget } from './moa'
import type { ResRow, SigState, HistEntry } from '../pages/MoaDetail/index'

// ── moa_cards row ──────────────────────────────────────────────────────────
export interface MoaCardRow {
  id: string
  title: string
  project: string
  status: MoaStatus
  exp_count: number
  best_yield: number | null
  yield_history: Array<{ id: string; yield: number | null }>
  author: string
  created_at: string   // 'YYYY-MM-DD'
  updated_at: string   // ISO timestamp
}

// ── moa_experiments row ────────────────────────────────────────────────────
export interface MoaExperimentRow {
  id: string           // FK → moa_cards.id
  exp: Exp[]
  com: Com[]
  base_target: BaseTarget
  cond: {
    temp: string; time: string; atm: string
    solvent: string; solventCustom: string; solventVol: string
  }
  rec_texts: Record<string, string>
  res_rows: ResRow[]
  dash_note: { text: string; imgs: { name: string; dataUrl: string }[] }
  sig: SigState
  history: HistEntry[]
  meta_title: string
  meta_project: string
  last_saved_at: string | null
}

// ── DB row → app type 변환 ─────────────────────────────────────────────────
export function rowToMoaCard(row: MoaCardRow): MoaCard {
  return {
    id: row.id,
    title: row.title,
    project: row.project,
    status: row.status,
    expCount: row.exp_count,
    bestYield: row.best_yield,
    yieldHistory: row.yield_history,
    author: row.author,
    createdAt: row.created_at,
  }
}
