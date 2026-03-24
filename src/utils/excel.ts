/**
 * Excel/CSV 유틸리티 (xlsx 없이 CSV로 구현)
 */
import type { ReagentItem } from '@/types/reagent';

const CAS_RE = /^\d{2,7}-\d{2}-\d$/;

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '').replace(/"/g, '""');
        return val.includes(',') || val.includes('\n') || val.includes('"') ? `"${val}"` : val;
      }).join(',')
    ),
  ];
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function downloadExcel(reagents: ReagentItem[], filename = '시약_목록.csv'): void {
  const rows = reagents.map(r => ({
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
  downloadCSV(rows, filename);
}

export function downloadTemplate(): void {
  const rows = [{
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
  }];
  downloadCSV(rows, '시약_일괄등록_템플릿.csv');
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

export async function parseExcel(file: File): Promise<ParsedReagentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) { resolve([]); return; }

        const colMap: Record<string, keyof ParsedReagentRow> = {
          '컴파운드명': 'compoundName', 'compound': 'compoundName', 'compoundname': 'compoundName',
          'cas 번호': 'casNumber', 'cas번호': 'casNumber', 'cas': 'casNumber',
          '용량': 'quantity', 'quantity': 'quantity',
          '단위': 'unit', 'unit': 'unit',
          '위치': 'location', 'location': 'location',
          '공급자': 'supplier', 'supplier': 'supplier',
          '제품번호': 'productNumber', 'productnumber': 'productNumber',
          '핀번호': 'pinCode', 'pincode': 'pinCode',
          'smiles': 'smiles', 'mw': 'mw',
          '순도': 'purity', '주의사항': 'notes',
        };

        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let cur = '', inQuote = false;
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') { inQuote = !inQuote; }
            else if (line[i] === ',' && !inQuote) { result.push(cur); cur = ''; }
            else { cur += line[i]; }
          }
          result.push(cur);
          return result;
        };

        const headers = parseLine(lines[0]).map(h => h.toLowerCase());
        const parsed: ParsedReagentRow[] = lines.slice(1).map((line, i) => {
          const vals = parseLine(line);
          const row: ParsedReagentRow = { _rowIndex: i + 1 };
          headers.forEach((h, j) => {
            const key = colMap[h];
            if (!key) return;
            const val = vals[j]?.trim() ?? '';
            if (key === 'quantity' || key === 'mw') {
              (row as Record<string, unknown>)[key] = parseFloat(val) || undefined;
            } else {
              (row as Record<string, unknown>)[key] = val;
            }
          });
          row._casValid = !row.casNumber || CAS_RE.test(row.casNumber.trim());
          return row;
        });
        resolve(parsed);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}
