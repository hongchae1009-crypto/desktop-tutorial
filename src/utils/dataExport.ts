/**
 * AI 학습용 JSON 내보내기 유틸리티 (Phase 3-B)
 */
import type { Exp, Com } from '@/types/moa';
import type { ResRow } from '@/pages/MoaDetail/index';
import { buildReactionSmiles } from './aiExport';

export interface AiTrainingRecord {
  schemaVersion: '1.0';
  exportedAt: string;
  experiment: {
    id: string;
    title: string;
    project: string;
    author: string;
  };
  conditions: {
    temperature?: string;
    time?: string;
    atmosphere?: string;
    solvent?: string;
    solventVol?: string;
  };
  variableReagents: Array<{
    id: string;
    name: string;
    pin: string;
    mw: number | null;
    eq: number;
    smiles?: string;
  }>;
  commonReagents: Array<{
    name: string;
    pin: string;
    mw: number | null;
    eq: number;
    smiles?: string;
  }>;
  results: Array<{
    experimentId: string;
    compoundName: string;
    compoundPin: string;
    mw: string;
    inputMg: string;
    outputMg: string;
    yieldPct: string;
    purityPct: string;
    method: string;
    reactionSmiles: string | null;
    analytics: {
      productSmiles?: string;
      lcmsMz?: string;
      nmrSolvent?: string;
      rfValue?: string;
      chromatographySystem?: string;
      hplcRetention?: string;
    };
  }>;
}

interface BuildInput {
  cardId: string;
  title: string;
  project: string;
  author: string;
  cond: { temp: string; time: string; atm: string; solvent: string; solventCustom: string; solventVol: string };
  exp: Exp[];
  com: Com[];
  resRows: ResRow[];
}

export function buildExportJson(input: BuildInput): AiTrainingRecord {
  const { cardId, title, project, author, cond, exp, com, resRows } = input;

  const calcYield = (inputMg: string, outputMg: string) => {
    const inp = parseFloat(inputMg), out = parseFloat(outputMg);
    if (isNaN(inp) || inp <= 0 || isNaN(out) || out <= 0) return '';
    return (out / inp * 100).toFixed(1);
  };

  const results = resRows.map((row, ri) => {
    const expItem = exp[ri];
    const rxnSmiles = buildReactionSmiles(
      [expItem?.smiles],
      com.map(c => c.smiles),
      row.productSmiles,
    );
    return {
      experimentId: expItem?.id ?? `EXP-${ri + 1}`,
      compoundName: row.cpdName,
      compoundPin: row.cpdPin,
      mw: row.cpdMw,
      inputMg: row.inputMg,
      outputMg: row.outputMg,
      yieldPct: calcYield(row.inputMg, row.outputMg),
      purityPct: row.purPct,
      method: row.meth,
      reactionSmiles: rxnSmiles,
      analytics: {
        productSmiles: row.productSmiles,
        lcmsMz: row.lcmsMz,
        nmrSolvent: row.nmrSolvent,
        rfValue: row.rfValue,
        chromatographySystem: row.chromatographySystem,
        hplcRetention: row.hplcRetention,
      },
    };
  });

  return {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    experiment: { id: cardId, title, project, author },
    conditions: {
      temperature: cond.temp || undefined,
      time: cond.time || undefined,
      atmosphere: cond.atm || undefined,
      solvent: cond.solvent || cond.solventCustom || undefined,
      solventVol: cond.solventVol || undefined,
    },
    variableReagents: exp.map(e => ({ id: e.id, name: e.name, pin: e.pin, mw: e.mw, eq: e.eq, smiles: e.smiles })),
    commonReagents: com.map(c => ({ name: c.name, pin: c.pin, mw: c.mw, eq: c.eq, smiles: c.smiles })),
    results,
  };
}

export function downloadJson(data: AiTrainingRecord, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
