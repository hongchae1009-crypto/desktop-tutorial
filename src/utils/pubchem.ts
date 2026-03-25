/**
 * PubChem REST API 유틸리티
 * API: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{cas}/JSON
 */
import type { ReagentItem } from '@/types/reagent';

export interface PubChemResult {
  compoundName?: string;
  smiles?: string;
  mw?: number;
  iupacName?: string;
  inchiKey?: string;
}

/**
 * CAS 번호로 PubChem에서 화합물 정보 조회
 */
export async function fetchByCas(cas: string): Promise<PubChemResult | null> {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cas)}/JSON`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const props: Array<{ urn: { label: string; name?: string }; value: { sval?: string; fval?: number } }> =
      json.PC_Compounds?.[0]?.props || [];

    let mw: number | undefined;
    let smiles: string | undefined;
    let iupacName: string | undefined;
    let inchiKey: string | undefined;

    props.forEach((p) => {
      const { label, name } = p.urn;
      if (label === 'Molecular Weight') {
        const val = p.value.fval ?? parseFloat(p.value.sval ?? '');
        if (!isNaN(val)) mw = val;
      }
      if (label === 'SMILES' && name === 'Isomeric') {
        smiles = p.value.sval;
      }
      if (label === 'IUPAC Name' && name === 'Preferred') {
        iupacName = p.value.sval;
      }
      if (label === 'InChIKey') {
        inchiKey = p.value.sval;
      }
    });

    return { compoundName: iupacName, smiles, mw, iupacName, inchiKey };
  } catch {
    return null;
  }
}

/**
 * 지원 도메인 목록 (Sigma-Aldrich, TCI, Alfa Aesar)
 */
const SUPPORTED_DOMAINS = ['sigmaaldrich.com', 'tcichemicals.com', 'alfa.com', 'alfaesar.com'];

/**
 * 구매 링크 URL에서 자동완성 정보 추출 (mock 구현)
 * 실제 환경에서는 서버사이드 스크래핑이나 API 통합 필요
 */
export async function autofillFromLink(url: string): Promise<Partial<ReagentItem> | null> {
  const supported = SUPPORTED_DOMAINS.some((d) => url.includes(d));
  if (!supported) return null;

  // 모의 API 딜레이
  await new Promise((r) => setTimeout(r, 1000));

  let supplier = 'Unknown';
  if (url.includes('sigma')) supplier = 'Sigma-Aldrich';
  else if (url.includes('tci')) supplier = 'TCI';
  else if (url.includes('alfa')) supplier = 'Alfa Aesar';

  // mock 데이터 반환
  return {
    compoundName: '4-Bromobenzaldehyde',
    casNumber: '1122-91-4',
    mw: 185.02,
    supplier,
    productNumber: 'B57400',
    shopLink: url,
  };
}
