import { useCallback, useState } from 'react';
import type { AnalysisMethod, AttFile, Exp, ResData } from '../../../../types/moa';
import { calcResultMmol } from '../../../../utils/moa';

const makeEmptyRes = (): ResData => ({
  cpd: { name: '', pin: '', mw: null, registered: false },
  yield: '',
  mg: '',
  pur: '',
  meth: '',
});

export function useResultTable(exp: Exp[]) {
  const [resData, setResData] = useState<ResData[]>(() => exp.map(() => makeEmptyRes()));
  const [att, setAtt] = useState<AttFile[][]>(() => exp.map(() => []));

  // exp 행이 늘거나 줄면 동기화
  const syncRows = useCallback((newExp: Exp[]) => {
    setResData(prev => {
      const next: ResData[] = newExp.map((_, i) => prev[i] ?? makeEmptyRes());
      return next;
    });
    setAtt(prev => {
      const next: AttFile[][] = newExp.map((_, i) => prev[i] ?? []);
      return next;
    });
  }, []);

  const updateResField = useCallback(<K extends keyof ResData>(
    ri: number, field: K, value: ResData[K],
  ) => {
    setResData(prev => prev.map((r, i) => i === ri ? { ...r, [field]: value } : r));
  }, []);

  const updateYield = useCallback((ri: number, value: string) => {
    setResData(prev => prev.map((r, i) => i === ri ? { ...r, yield: value } : r));
  }, []);

  const updateMg = useCallback((ri: number, value: string) => {
    setResData(prev => prev.map((r, i) => i === ri ? { ...r, mg: value } : r));
  }, []);

  const updatePur = useCallback((ri: number, value: string) => {
    setResData(prev => prev.map((r, i) => i === ri ? { ...r, pur: value } : r));
  }, []);

  const updateMeth = useCallback((ri: number, value: AnalysisMethod) => {
    setResData(prev => prev.map((r, i) => i === ri ? { ...r, meth: value } : r));
  }, []);

  const updateCpdName = useCallback((ri: number, value: string) => {
    setResData(prev => prev.map((r, i) =>
      i === ri ? { ...r, cpd: { ...r.cpd, name: value } } : r,
    ));
  }, []);

  const applyCpd = useCallback((ri: number, cpd: { name: string; pin: string; mw: number }) => {
    setResData(prev => prev.map((r, i) =>
      i === ri ? { ...r, cpd: { ...cpd, registered: false } } : r,
    ));
  }, []);

  const markRegistered = useCallback((ri: number) => {
    setResData(prev => prev.map((r, i) =>
      i === ri ? { ...r, cpd: { ...r.cpd, registered: true } } : r,
    ));
  }, []);

  const addFiles = useCallback((ri: number, files: AttFile[]) => {
    setAtt(prev => prev.map((a, i) => i === ri ? [...a, ...files] : a));
  }, []);

  const removeFile = useCallback((ri: number, fi: number) => {
    setAtt(prev => prev.map((a, i) => i === ri ? a.filter((_, j) => j !== fi) : a));
  }, []);

  const getMmol = useCallback((ri: number): string | null => {
    const r = resData[ri];
    return calcResultMmol(r.mg, r.cpd.mw);
  }, [resData]);

  const getYields = useCallback((): (number | null)[] =>
    resData.map(r => {
      const v = parseFloat(r.yield);
      return isNaN(v) ? null : v;
    }),
  [resData]);

  return {
    resData, att,
    syncRows,
    updateResField, updateYield, updateMg, updatePur, updateMeth,
    updateCpdName, applyCpd, markRegistered,
    addFiles, removeFile,
    getMmol, getYields,
  };
}
