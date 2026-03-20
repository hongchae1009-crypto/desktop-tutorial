import { useCallback, useState } from 'react';
import type { BaseTarget, Com, ComCell, Exp, ReagentModalTarget } from '../../../../types/moa';
import {
  autoMmol,
  calcWeight,
  getBaseMmol,
  isBaseCom,
  isBaseE,
  nextComName,
  verifyColspan,
} from '../../../../utils/moa';
import { useUndoStack } from '../../../../hooks/useUndoStack';

interface QuantSnapshot {
  exp: Exp[];
  com: Com[];
  baseTarget: BaseTarget;
}

const cloneSnapshot = (exp: Exp[], com: Com[], baseTarget: BaseTarget): QuantSnapshot => ({
  exp: JSON.parse(JSON.stringify(exp)),
  com: JSON.parse(JSON.stringify(com)),
  baseTarget,
});

// ── 초기 데이터 ───────────────────────────────────────────
const INIT_EXP: Exp[] = [
  { id: 'HCE-1', name: '1-Bromo-2-fluorobenzene',              pin: 'K01251', mw: 175,    eq: 1, baseMmol: '10.13', m: '1772'   },
  { id: 'HCE-2', name: '1-Bromo-2,4-dimethoxybenzene',         pin: 'K01275', mw: 217.06, eq: 1, baseMmol: '10.57', m: '2293.8' },
  { id: 'HCE-3', name: '1-Bromo-2-(trifluoromethoxy)benzene',  pin: 'K01230', mw: 241.01, eq: 1, baseMmol: '',      m: ''       },
];

const INIT_COM: Com[] = [
  { name: 'Piperazine',           pin: 'K00504', mw: 86.14,  eq: 2.03,  baseMmol: '', cells: [{ m: '3342.5' }, { m: '3439.2' }, { m: '' }] },
  { name: 'Ruphos',               pin: 'K00595', mw: 466.6,  eq: 0.375, baseMmol: '', cells: [{ m: '99.2'   }, { m: '105.8'  }, { m: '' }] },
  { name: 'Sodium tert-butoxide', pin: 'K00622', mw: 96.1,   eq: 1.82,  baseMmol: '', cells: [{ m: '1319.3' }, { m: '1320.5' }, { m: '' }] },
];

export function useQuantTable() {
  const [exp, setExp] = useState<Exp[]>(INIT_EXP);
  const [com, setCom] = useState<Com[]>(INIT_COM);
  const [baseTarget, setBaseTargetState] = useState<BaseTarget>('exp');
  const [refOn, setRefOn] = useState(true);
  const [comColIdx, setComColIdx] = useState(INIT_COM.length);

  // 시약 검색 모달 상태
  const [reagentModal, setReagentModal] = useState<ReagentModalTarget | null>(null);

  const undo = useUndoStack<QuantSnapshot>();

  // ── 스냅샷 + 변경 ────────────────────────────────────────
  const pushAndSet = useCallback((
    desc: string,
    newExp: Exp[],
    newCom: Com[],
    newBase: BaseTarget,
  ) => {
    undo.push(desc, cloneSnapshot(exp, com, baseTarget));
    setExp(newExp);
    setCom(newCom);
    setBaseTargetState(newBase);
  }, [exp, com, baseTarget, undo]);

  const doUndo = useCallback(() => {
    const entry = undo.pop();
    if (!entry) return null;
    setExp(entry.snapshot.exp);
    setCom(entry.snapshot.com);
    setBaseTargetState(entry.snapshot.baseTarget);
    return entry.desc;
  }, [undo]);

  // ── 기준물질 변경 ────────────────────────────────────────
  const setBase = useCallback((target: BaseTarget) => {
    pushAndSet('기준물질 변경', exp, com, target);
  }, [pushAndSet, exp, com]);

  // ── 변수시약 행 업데이트 ──────────────────────────────────
  const updateExpField = useCallback(<K extends keyof Exp>(ri: number, field: K, value: Exp[K]) => {
    setExp(prev => {
      const next = [...prev];
      next[ri] = { ...next[ri], [field]: value };
      return next;
    });
  }, []);

  const updateExpMeasure = useCallback((ri: number, value: string) => {
    setExp(prev => {
      const next = [...prev];
      next[ri] = { ...next[ri], m: value };
      return next;
    });
  }, []);

  // ── 공통시약 셀 업데이트 ──────────────────────────────────
  const updateComCell = useCallback((ci: number, ri: number, value: string) => {
    setCom(prev => {
      const next = prev.map((c, idx) => {
        if (idx !== ci) return c;
        const cells = c.cells.map((cell, cellIdx) =>
          cellIdx === ri ? { ...cell, m: value } : cell,
        );
        return { ...c, cells };
      });
      return next;
    });
  }, []);

  const updateComField = useCallback(<K extends keyof Com>(ci: number, field: K, value: Com[K]) => {
    setCom(prev => {
      const next = [...prev];
      next[ci] = { ...next[ci], [field]: value };
      return next;
    });
  }, []);

  // ── 행 추가 / 삭제 ───────────────────────────────────────
  const addExpRow = useCallback(() => {
    const newId = `HCE-${exp.length + 1}`;
    const newExp: Exp = { id: newId, name: '', pin: '', mw: null, eq: 1, baseMmol: '', m: '' };
    const newCom = com.map(c => ({ ...c, cells: [...c.cells, { m: '' } as ComCell] }));
    pushAndSet('실험 추가', [...exp, newExp], newCom, baseTarget);
  }, [exp, com, baseTarget, pushAndSet]);

  const delExpRow = useCallback((ri: number) => {
    const newExp = exp.filter((_, i) => i !== ri);
    const newCom = com.map(c => ({ ...c, cells: c.cells.filter((_, i) => i !== ri) }));
    pushAndSet('실험 삭제', newExp, newCom, baseTarget);
  }, [exp, com, baseTarget, pushAndSet]);

  // ── 공통시약 열 추가 / 삭제 ──────────────────────────────
  const addComCol = useCallback(() => {
    const newCom: Com = {
      name: nextComName(comColIdx),
      pin: '',
      mw: null,
      eq: 1,
      baseMmol: '',
      cells: exp.map(() => ({ m: '' })),
    };
    pushAndSet('공통시약 추가', exp, [...com, newCom], baseTarget);
    setComColIdx(prev => prev + 1);
  }, [exp, com, baseTarget, comColIdx, pushAndSet]);

  const delComCol = useCallback((ci: number) => {
    const newCom = com.filter((_, i) => i !== ci);
    // 삭제된 열이 기준물질이었으면 'exp'로 초기화
    const newBase: BaseTarget = baseTarget === `com-${ci}` ? 'exp' : baseTarget;
    pushAndSet('공통시약 삭제', exp, newCom, newBase);
  }, [exp, com, baseTarget, pushAndSet]);

  // ── 시약 선택 (모달 결과) ────────────────────────────────
  const applyReagent = useCallback((reagent: { name: string; pin: string; mw: number }) => {
    if (!reagentModal) return;
    if (reagentModal.kind === 'exp') {
      pushAndSet(
        '변수시약 선택',
        exp.map((e, i) =>
          i === reagentModal.ri ? { ...e, name: reagent.name, pin: reagent.pin, mw: reagent.mw } : e,
        ),
        com,
        baseTarget,
      );
    } else {
      pushAndSet(
        '공통시약 선택',
        exp,
        com.map((c, i) =>
          i === reagentModal.ci ? { ...c, name: reagent.name, pin: reagent.pin, mw: reagent.mw } : c,
        ),
        baseTarget,
      );
    }
    setReagentModal(null);
  }, [reagentModal, exp, com, baseTarget, pushAndSet]);

  // ── 파생 계산값 (렌더 타임에 사용) ────────────────────────
  const getExpCalc = useCallback((ri: number) => {
    const d = exp[ri];
    const base = getBaseMmol(ri, baseTarget, exp, com);
    const isBase = isBaseE(baseTarget);
    const mmol = isBase
      ? (parseFloat(d.baseMmol) || 0)
      : (parseFloat(autoMmol(base, d.eq) ?? '0') || 0);
    const weight = calcWeight(mmol, d.mw);
    return { mmol, weight };
  }, [exp, com, baseTarget]);

  const getComCalc = useCallback((ri: number, ci: number) => {
    const c = com[ci];
    const base = getBaseMmol(ri, baseTarget, exp, com);
    const isBCom = isBaseCom(ci, baseTarget);
    const mmolStr = isBCom ? String(c.baseMmol || '') : (autoMmol(base, c.eq) ?? '');
    const weight = calcWeight(mmolStr, c.mw);
    return { mmolStr, weight };
  }, [com, baseTarget, exp]);

  // ── colspan 검증 (개발 경고) ──────────────────────────────
  const checkColspan = useCallback(() => {
    const result = verifyColspan(refOn, com.length);
    if (!result.valid) {
      console.error('[QuantTable] colspan 검증 실패!', result);
    }
    return result;
  }, [refOn, com.length]);

  return {
    // state
    exp, com, baseTarget, refOn, reagentModal,
    // undo
    canUndo: undo.canUndo, lastDesc: undo.lastDesc, doUndo,
    // setters (inline 변경용)
    setRefOn,
    setReagentModal,
    // mutators
    setBase,
    updateExpField,
    updateExpMeasure,
    updateComCell,
    updateComField,
    addExpRow, delExpRow,
    addComCol, delComCol,
    applyReagent,
    // computed
    getExpCalc,
    getComCalc,
    checkColspan,
  };
}
