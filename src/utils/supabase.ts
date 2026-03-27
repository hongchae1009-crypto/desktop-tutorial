import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const SUPABASE_READY = Boolean(url && key)

if (!SUPABASE_READY) {
  console.warn('[Supabase] 환경변수 미설정 — 데이터가 저장되지 않습니다. .env에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 추가하세요.')
}

// createClient는 유효한 URL이 있을 때만 호출
export const supabase = SUPABASE_READY
  ? createClient(url!, key!)
  : createClient('https://placeholder.supabase.co', 'placeholder')
