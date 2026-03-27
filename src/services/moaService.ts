/**
 * Supabase CRUD 서비스 — MOA 실험 데이터 영구 저장
 */
import { supabase, SUPABASE_READY } from '../utils/supabase'
import type { MoaCard, Exp, Com, BaseTarget } from '../types/moa'
import type { MoaCardRow, MoaExperimentRow } from '../types/db'
import { rowToMoaCard } from '../types/db'
import type { ResRow, SigState, HistEntry } from '../pages/MoaDetail/index'

// ─── 카드 목록 ──────────────────────────────────────────────────────────────

/** 전체 카드 목록 조회 (생성일 내림차순) */
export async function fetchCards(): Promise<MoaCard[]> {
  if (!SUPABASE_READY) return []
  const { data, error } = await supabase
    .from('moa_cards')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as MoaCardRow[]).map(rowToMoaCard)
}

/** 새 카드 INSERT */
export async function createCard(card: MoaCard): Promise<void> {
  if (!SUPABASE_READY) return
  const row = {
    id: card.id,
    title: card.title,
    project: card.project,
    status: card.status,
    exp_count: card.expCount,
    best_yield: card.bestYield,
    yield_history: card.yieldHistory,
    author: card.author,
    created_at: card.createdAt,
  }
  const { error } = await supabase.from('moa_cards').insert(row)
  if (error) throw error
}

/** 카드 요약 필드 UPDATE */
export async function updateCardSummary(
  id: string,
  patch: Partial<Pick<MoaCardRow, 'title' | 'project' | 'status' | 'exp_count' | 'best_yield' | 'yield_history'>>,
): Promise<void> {
  if (!SUPABASE_READY) return
  const { error } = await supabase
    .from('moa_cards')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** 카드 삭제 (moa_experiments도 CASCADE) */
export async function deleteCard(id: string): Promise<void> {
  if (!SUPABASE_READY) return
  const { error } = await supabase.from('moa_cards').delete().eq('id', id)
  if (error) throw error
}

// ─── 실험 상세 ─────────────────────────────────────────────────────────────

/** 카드 ID로 실험 상세 로딩. 미저장 상태면 null 반환. */
export async function fetchExperiment(cardId: string): Promise<MoaExperimentRow | null> {
  if (!SUPABASE_READY) return null
  const { data, error } = await supabase
    .from('moa_experiments')
    .select('*')
    .eq('id', cardId)
    .maybeSingle()
  if (error) throw error
  return data as MoaExperimentRow | null
}

export interface SaveExperimentPayload {
  id: string
  exp: Exp[]
  com: Com[]
  base_target: BaseTarget
  cond: { temp: string; time: string; atm: string; solvent: string; solventCustom: string; solventVol: string }
  rec_texts: Record<string, string>
  res_rows: ResRow[]
  dash_note: { text: string; imgs: { name: string; dataUrl: string }[] }
  sig: SigState
  history: HistEntry[]
  meta_title: string
  meta_project: string
}

/**
 * 실험 상세 UPSERT + 카드 요약 필드 자동 동기화
 */
export async function saveExperiment(payload: SaveExperimentPayload): Promise<void> {
  if (!SUPABASE_READY) return
  const now = new Date().toISOString()

  // 카드 요약 필드 계산 (resRows에서)
  const validYields = payload.res_rows
    .map(r => {
      const inp = parseFloat(r.inputMg), out = parseFloat(r.outputMg)
      return inp > 0 && out > 0 ? parseFloat((out / inp * 100).toFixed(1)) : null
    })
    .filter((v): v is number => v !== null)

  const bestYield = validYields.length ? Math.max(...validYields) : null
  const yieldHistory = payload.exp.map((e, ri) => {
    const r = payload.res_rows[ri]
    const inp = parseFloat(r?.inputMg ?? ''), out = parseFloat(r?.outputMg ?? '')
    const y = inp > 0 && out > 0 ? parseFloat((out / inp * 100).toFixed(1)) : null
    return { id: e.id, yield: y }
  })

  // moa_experiments UPSERT
  const expRow: MoaExperimentRow = { ...payload, last_saved_at: now }
  const { error: expErr } = await supabase
    .from('moa_experiments')
    .upsert(expRow, { onConflict: 'id' })
  if (expErr) throw expErr

  // moa_cards 요약 동기화
  await updateCardSummary(payload.id, {
    title: payload.meta_title,
    project: payload.meta_project,
    exp_count: payload.exp.length,
    best_yield: bestYield,
    yield_history: yieldHistory,
  })
}

// ─── ID 생성 ───────────────────────────────────────────────────────────────

/** 'MB-PRI-HCE-YYYY-NNNNN' 형식 순번 ID 생성 (DB에서 마지막 번호 조회) */
export async function generateCardId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `MB-PRI-HCE-${year}-`
  const { data } = await supabase
    .from('moa_cards')
    .select('id')
    .like('id', `${prefix}%`)
    .order('id', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (data && data.length > 0) {
    const lastNum = parseInt((data[0] as { id: string }).id.replace(prefix, ''), 10)
    if (!isNaN(lastNum)) nextNum = lastNum + 1
  }
  return `${prefix}${String(nextNum).padStart(5, '0')}`
}
