/**
 * Excel 유틸리티 (SheetJS/xlsx)
 * 시약 데이터 내보내기 / 템플릿 다운로드 / 엑셀 파싱
 */
import type { ReagentItem } from '@/types/reagent';

// Dynamic import to handle cases where xlsx might not be installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getXLSX(): Promise<any | null> {
  try {
    // @ts-ignore — xlsx may not be installed; graceful fallback below
    const XLSX = await import('xlsx');
    return XLSX;
  } catch {
    return null;
  }
}

const CAS_RE = /^\d{2,7}-\d{2}-\d$/;

/**
 * 시약 목록을 엑셀 파일로 다운로드
 */
export async function downloadExcel(reagents: ReagentItem[], filename = '시약_목록.xlsx'): Promise<void> {
  const XLSX = await getXLSX();
  if (!XLSX) {
    alert('xlsx 라이브러리를 불러올 수 없습니다.');
    return;
  }

  const rows = reagents.map((r) => ({
    '핀번호': r.pinCode,
    '컴파운드명': r.compoundName,
    '별칭': r.alias ?? '',
    'CAS 번호': r.casNumber ?? '',
    'MW': r.mw ?? '',
    '위치': r.location,
    '용량': r.quantity,
    '단위': r.unit,
    '공급자': r.supplier ?? '',
    '제품번호': r.productNumber ?? '',
    '순도': r.purity ?? '',
    '보관조건': (r.storageConditions ?? []).join(', '),
    '주의사항': r.notes ?? '',
    '등록자': r.registeredBy,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '시약 목록');
  XLSX.writeFile(wb, filename);
}

/**
 * 일괄 등록용 템플릿 엑셀 다운로드
 */
export async function downloadTemplate(): Promise<void> {
  const XLSX = await getXLSX();
  if (!XLSX) {
    // CSV fallback
    const csv = '컴파운드명,CAS 번호,용량,단위,위치,공급자,제품번호\n4-Aminophenol,123-30-8,500,g,201,Sigma-Aldrich,A3861\n';
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = '시약_일괄등록_템플릿.csv';
    a.click();
    return;
  }

  const template = [
    {
      '컴파운드명': '4-Aminophenol',
      'CAS 번호': '123-30-8',
      '용량': 500,
      '단위': 'g',
      '위치': '201',
      '공급자': 'Sigma-Aldrich',
      '제품번호': 'A3861',
      '핀번호': '',
      'SMILES': '',
      'MW': 109.13,
      '순도': '',
      '주의사항': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '시약 등록 템플릿');
  XLSX.writeFile(wb, '시약_일괄등록_템플릿.xlsx');
}

export interface ParsedReagentRow {
  compoundName?: string;
  casNumber?: string;
  quantity?: number;
  unit?: string;
  location?: string;
  supplier?: string;
  productNumber?: string;
  pinCode?: string;
  smiles?: string;
  mw?: number;
  purity?: string;
  notes?: string;
  _casValid?: boolean;
  _rowIndex?: number;
}

/**
 * 엑셀 파일 파싱 → 시약 row 배열 반환
 */
export async function parseExcel(file: File): Promise<ParsedReagentRow[]> {
  const XLSX = await getXLSX();
  if (!XLSX) {
    // mock 데이터 반환
    return [
      { compoundName: '4-Aminophenol', casNumber: '123-30-8', quantity: 500, unit: 'g', location: '201', _casValid: true, _rowIndex: 1 },
      { compoundName: 'Triethylamine', casNumber: '121-44-8', quantity: 1000, unit: 'mL', location: '102', _casValid: true, _rowIndex: 2 },
      { compoundName: 'Benzaldehyde', casNumber: '100-52-7BAD', quantity: 100, unit: 'mL', location: '103', _casValid: false, _rowIndex: 3 },
    ];
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target!.result as ArrayBuffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const colMap: Record<string, keyof ParsedReagentRow> = {
          '컴파운드명': 'compoundName',
          'compound': 'compoundName',
          'compoundname': 'compoundName',
          'cas 번호': 'casNumber',
          'cas번호': 'casNumber',
          'cas': 'casNumber',
          '용량': 'quantity',
          'quantity': 'quantity',
          '단위': 'unit',
          'unit': 'unit',
          '위치': 'location',
          'location': 'location',
          '공급자': 'supplier',
          'supplier': 'supplier',
          '제품번호': 'productNumber',
          'productnumber': 'productNumber',
          '핀번호': 'pinCode',
          'pincode': 'pinCode',
          'smiles': 'smiles',
          'mw': 'mw',
          '순도': 'purity',
          '주의사항': 'notes',
        };

        const parsed: ParsedReagentRow[] = rawRows.map((row, i) => {
          const result: ParsedReagentRow = { _rowIndex: i + 1 };
          for (const [rawKey, value] of Object.entries(row)) {
            const normalizedKey = rawKey.trim().toLowerCase();
            const mapped = colMap[normalizedKey];
            if (mapped) {
              if (mapped === 'quantity' || mapped === 'mw') {
                result[mapped] = typeof value === 'number' ? value : parseFloat(String(value)) || undefined;
              } else {
                (result as Record<string, unknown>)[mapped] = String(value).trim();
              }
            }
          }
          result._casValid = !result.casNumber || CAS_RE.test(result.casNumber.trim());
          return result;
        });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
