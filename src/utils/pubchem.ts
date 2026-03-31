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
  casNumber?: string;  // 동의어에서 추출한 CAS 번호 (이름 검색 시)
}

const CAS_RE = /^\d{2,7}-\d{2}-\d$/;

/**
 * PubChem props 배열에서 분자 정보 파싱 (공통 로직)
 */
function parseProps(
  props: Array<{ urn: { label: string; name?: string }; value: { sval?: string; fval?: number } }>,
): Omit<PubChemResult, 'casNumber'> {
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
    const compound = json.PC_Compounds?.[0];
    if (!compound) return null;

    const props = compound.props || [];
    return parseProps(props);
  } catch {
    return null;
  }
}

/**
 * 물질명으로 PubChem에서 화합물 정보 조회
 * CAS 번호는 동의어 목록에서 추출
 */
export async function fetchByName(name: string): Promise<PubChemResult | null> {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/JSON`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const compound = json.PC_Compounds?.[0];
    if (!compound) return null;

    const result = parseProps(compound.props || []);
    const cid: number | undefined = compound.id?.id?.cid;

    // 동의어에서 CAS 번호 추출
    let casNumber: string | undefined;
    if (cid) {
      try {
        const synRes = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`,
        );
        if (synRes.ok) {
          const synJson = await synRes.json();
          const synonyms: string[] = synJson.InformationList?.Information?.[0]?.Synonym ?? [];
          casNumber = synonyms.find((s) => CAS_RE.test(s));
        }
      } catch {
        // CAS 추출 실패 시 무시
      }
    }

    return { ...result, casNumber };
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
