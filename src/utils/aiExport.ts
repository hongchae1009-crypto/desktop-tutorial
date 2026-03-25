/**
 * AI 컨텍스트 내보내기 유틸리티
 * 모아실험 데이터를 Claude/ChatGPT 즉시 붙여넣기 프롬프트로 변환
 */
import type { Exp, Com, ResData, MoaCard, BaseTarget } from '@/types/moa';

interface AiExportInput {
  card: MoaCard;
  exp: Exp[];
  com: Com[];
  baseTarget: BaseTarget;
  resData: ResData[];
}

/**
 * 실험 데이터를 구조화된 AI 상담용 텍스트로 변환
 */
export function buildAiPrompt(input: AiExportInput): string {
  const { card, exp, com, baseTarget, resData } = input;

  const line = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  // 기준물질 파악
  const baseLabel =
    baseTarget === 'exp'
      ? (exp[0]?.name ?? '—')
      : (() => {
          const ci = parseInt((baseTarget as string).replace('com-', ''), 10);
          return com[ci]?.name ?? '—';
        })();

  // 변수시약 요약
  const expLines = exp
    .map((e, i) => {
      const res = resData[i];
      const yieldStr = res?.yield ? `${res.yield}%` : '—';
      const mwStr = e.mw ? `MW ${e.mw}` : '';
      return `  [${e.id}] ${e.name}${mwStr ? ` (${mwStr})` : ''}  →  수율 ${yieldStr}`;
    })
    .join('\n');

  // 공통시약 요약
  const comLines =
    com.length === 0
      ? '  (없음)'
      : com.map((c) => `  ${c.name} (${c.eq} eq${c.mw ? `, MW ${c.mw}` : ''})`).join('\n');

  // 최고 수율 정보
  const validYields = resData
    .map((r, i) => ({ id: exp[i]?.id ?? `exp-${i}`, y: parseFloat(r.yield) }))
    .filter((v) => !isNaN(v.y));
  const best = validYields.sort((a, b) => b.y - a.y)[0];
  const bestStr = best ? `${best.y}% (${best.id})` : '—';

  // 분석 방법 목록
  const meths = [...new Set(resData.map((r) => r.meth).filter(Boolean))];
  const methStr = meths.length ? meths.join(', ') : '—';

  const prompt = [
    line,
    `📋 AI 상담용 실험 요약`,
    `   프로젝트: ${card.project}   반응명: ${card.title}`,
    line,
    `[기준물질]`,
    `  ${baseLabel}`,
    ``,
    `[변수 조건 및 수율]`,
    expLines || '  (없음)',
    ``,
    `[공통시약]`,
    comLines,
    ``,
    `[실험 결과 요약]`,
    `  최고 수율: ${bestStr}`,
    `  분석 방법: ${methStr}`,
    `  실험 횟수: ${exp.length}건`,
    line,
    `❓ 질문: `,
  ].join('\n');

  return prompt;
}

/**
 * 반응 SMILES 자동 생성 (3-A)
 * 포맷: reactant1.reactant2>reagent1.reagent2>product
 */
export function buildReactionSmiles(
  reactantSmiles: (string | undefined)[],
  reagentSmiles: (string | undefined)[],
  productSmiles: string | undefined,
): string | null {
  const reactants = reactantSmiles.filter(Boolean).join('.');
  const reagents = reagentSmiles.filter(Boolean).join('.');
  const product = productSmiles?.trim() ?? '';
  if (!reactants && !product) return null;
  return `${reactants}>${reagents}>${product}`;
}

/**
 * 텍스트를 클립보드에 복사하고 성공 여부를 반환
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback: document.execCommand
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}
