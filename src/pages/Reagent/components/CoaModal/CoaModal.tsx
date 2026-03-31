/**
 * CoaModal — Certificate of Analysis 편집 및 발행 모달
 * - 시약장 데이터 자동연동 (화합물명, CAS, MW, 보관조건 등)
 * - 분석 데이터 직접 입력 (appearance, NMR, purity, 커스텀 행)
 * - 미리보기 + window.print() PDF 출력
 * - Jinuchem COA_Template.docx 레이아웃 준수
 */
import { useRef, useState } from 'react';
import type { ReagentItem } from '@/types/reagent';
import type { CoaAnalysisRow, CoaFormData } from '@/types/coa';

interface CoaModalProps {
  reagent: ReagentItem;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

function makeDefaultRows(reagent: ReagentItem): CoaAnalysisRow[] {
  return [
    { id: 'r1', test: 'Appearance', specification: 'White powder', result: 'Conforms' },
    { id: 'r2', test: '¹H NMR', specification: 'Consistent with the structure', result: 'Conforms' },
    {
      id: 'r3',
      test: 'Purity',
      specification: `≥ ${reagent.purity ?? '98'}% (HPLC)`,
      result: 'Conforms',
    },
  ];
}

function storageLabel(reagent: ReagentItem): string {
  if (!reagent.storageConditions?.length) return '—';
  const map: Record<string, string> = {
    'RT': 'Room temperature', '냉장': '2–8°C', '냉동': '-20°C',
    '극저온': '-80°C', '차광': 'Keep away from light',
    '위험물': 'Hazardous', '불활성': 'Under inert gas',
  };
  return reagent.storageConditions.map((c) => map[c] ?? c).join(', ');
}

export default function CoaModal({ reagent, onClose }: CoaModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<CoaFormData>({
    chemicalName: reagent.compoundName,
    batchNumber: reagent.pinCode,
    casNumber: reagent.casNumber ?? '—',
    manufactureDate: today(),
    molecularFormula: '',
    storageCondition: storageLabel(reagent),
    molecularWeight: reagent.mw ? String(reagent.mw) : '',
    quantity: `${reagent.quantity} ${reagent.unit}`,
    analysisRows: makeDefaultRows(reagent),
    conclusion: 'The above product meets the specifications of Jinuchem.',
    analystName: reagent.registeredBy,
    analystDate: today(),
    reviewerName: '',
    reviewerDate: today(),
  });

  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  function setField<K extends keyof CoaFormData>(key: K, value: CoaFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateRow(id: string, field: keyof CoaAnalysisRow, value: string) {
    setForm((f) => ({
      ...f,
      analysisRows: f.analysisRows.map((r) => r.id === id ? { ...r, [field]: value } : r),
    }));
  }

  function addRow() {
    setForm((f) => ({
      ...f,
      analysisRows: [...f.analysisRows, { id: Date.now().toString(), test: '', specification: '', result: 'Conforms' }],
    }));
  }

  function removeRow(id: string) {
    setForm((f) => ({ ...f, analysisRows: f.analysisRows.filter((r) => r.id !== id) }));
  }

  function handlePrint() {
    const win = window.open('', '_blank');
    if (!win || !printRef.current) return;
    win.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>COA — ${form.chemicalName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; background: #fff; padding: 20mm 18mm; }
  .title { font-size: 18pt; font-weight: bold; text-align: center; letter-spacing: 2px; margin-bottom: 6mm; }
  .section-header { font-size: 10pt; font-weight: bold; background: #1a3a5c; color: #fff; padding: 3px 8px; margin: 5mm 0 3mm; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #555; border-bottom: none; }
  .info-cell { display: flex; padding: 4px 8px; border-bottom: 1px solid #555; font-size: 10pt; }
  .info-cell:nth-child(odd) { border-right: 1px solid #555; }
  .info-label { font-weight: bold; min-width: 130px; }
  .info-value { flex: 1; }
  .structure-cell { grid-column: 1 / -1; padding: 6px 8px; border-bottom: 1px solid #555; border-right: none; min-height: 40mm; display: flex; align-items: center; gap: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  th, td { border: 1px solid #555; padding: 4px 8px; text-align: left; }
  th { background: #f0f0f0; font-weight: bold; }
  .conclusion { margin: 5mm 0 3mm; font-size: 10pt; font-style: italic; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4mm; font-size: 10pt; }
  .sig-box { border: 1px solid #999; padding: 8px; min-height: 20mm; }
  .sig-label { font-weight: bold; margin-bottom: 4mm; }
  .sig-line { border-top: 1px solid #000; margin-top: 10mm; font-size: 9pt; color: #555; padding-top: 2px; display: flex; justify-content: space-between; }
  .footer { margin-top: 8mm; text-align: right; font-size: 9pt; color: #555; border-top: 1px solid #ccc; padding-top: 3mm; }
  @page { size: A4; margin: 0; }
</style>
</head><body>
${printRef.current.innerHTML}
</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  }

  /* ── 공통 인풋 스타일 ── */
  const inp: React.CSSProperties = {
    width: '100%', padding: '5px 8px',
    border: '1px solid var(--border2)', borderRadius: 'var(--r)',
    fontSize: '12px', fontFamily: 'inherit',
    background: 'var(--surface)', color: 'var(--text)', outline: 'none',
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{
        width: '900px', maxHeight: '92vh',
        background: 'var(--surface)', borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: 500 }}>COA 발행</span>
            <span style={{ fontSize: '11px', color: 'var(--hint)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: '10px' }}>
              {reagent.compoundName}
            </span>
          </div>
          {/* 탭 */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['edit', 'preview'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '5px 14px', fontSize: '12px', border: '1px solid var(--border2)',
                  borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit',
                  background: tab === t ? 'var(--blue)' : 'var(--surface)',
                  color: tab === t ? '#fff' : 'var(--muted)',
                  borderColor: tab === t ? 'var(--blue)' : 'var(--border2)',
                }}
              >
                {t === 'edit' ? '✏️ 편집' : '👁 미리보기'}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ fontSize: '16px', color: 'var(--hint)', cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1 }}>✕</button>
        </div>

        {/* 바디 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ──── 편집 탭 ──── */}
          {tab === 'edit' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '20px 24px' }}>

              {/* 좌측: Product Information */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>
                  ▶ Product Information
                  <span style={{ fontWeight: 400, color: 'var(--hint)', marginLeft: '6px', fontSize: '10px', textTransform: 'none' }}>시약장에서 자동완성됨</span>
                </div>

                {(
                  [
                    { label: 'Chemical Name', key: 'chemicalName' },
                    { label: 'Batch Number', key: 'batchNumber' },
                    { label: 'CAS Registry No.', key: 'casNumber' },
                    { label: 'Manufacture Date', key: 'manufactureDate', type: 'date' },
                    { label: 'Molecular Formula', key: 'molecularFormula', placeholder: 'C₃H₅NO' },
                    { label: 'Storage Condition', key: 'storageCondition' },
                    { label: 'Molecular Weight', key: 'molecularWeight', placeholder: 'g/mol' },
                    { label: 'Quantity', key: 'quantity' },
                  ] as Array<{ label: string; key: keyof CoaFormData; type?: string; placeholder?: string }>
                ).map(({ label, key, type, placeholder }) => (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '3px', fontWeight: 500 }}>{label}</label>
                    <input
                      type={type ?? 'text'}
                      value={form[key] as string}
                      placeholder={placeholder}
                      onChange={(e) => setField(key, e.target.value as CoaFormData[typeof key])}
                      style={inp}
                    />
                  </div>
                ))}
              </div>

              {/* 우측: Analysis Data + Signatures */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>
                  ▶ Analysis Data
                </div>

                {/* 분석 행 */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 2fr 20px', gap: '4px', marginBottom: '4px' }}>
                    {['Test', 'Specification', 'Result', ''].map((h) => (
                      <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: 'var(--hint)', textTransform: 'uppercase' }}>{h}</span>
                    ))}
                  </div>
                  {form.analysisRows.map((row) => (
                    <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 2fr 20px', gap: '4px', marginBottom: '4px' }}>
                      <input value={row.test} onChange={(e) => updateRow(row.id, 'test', e.target.value)} style={inp} placeholder="Test" />
                      <input value={row.specification} onChange={(e) => updateRow(row.id, 'specification', e.target.value)} style={inp} placeholder="Specification" />
                      <input value={row.result} onChange={(e) => updateRow(row.id, 'result', e.target.value)} style={inp} placeholder="Result" />
                      <button
                        onClick={() => removeRow(row.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--hint)', fontSize: '14px', padding: 0, lineHeight: 1, alignSelf: 'center' }}
                        title="행 삭제"
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={addRow}
                    style={{ fontSize: '11px', color: 'var(--blue)', background: 'none', border: '1px dashed var(--blue)', borderRadius: 'var(--r)', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}
                  >
                    + 행 추가
                  </button>
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '14px 0' }} />

                {/* Conclusion */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '3px', fontWeight: 500 }}>Conclusion</label>
                  <textarea
                    value={form.conclusion}
                    onChange={(e) => setField('conclusion', e.target.value)}
                    rows={2}
                    style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
                  />
                </div>

                {/* Signatures */}
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>
                  ▶ Signatures
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '3px', display: 'block', fontWeight: 500 }}>Analyst</label>
                    <input value={form.analystName} onChange={(e) => setField('analystName', e.target.value)} style={inp} placeholder="이름" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '3px', display: 'block', fontWeight: 500 }}>Date</label>
                    <input type="date" value={form.analystDate} onChange={(e) => setField('analystDate', e.target.value)} style={inp} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '3px', display: 'block', fontWeight: 500 }}>Reviewed by</label>
                    <input value={form.reviewerName} onChange={(e) => setField('reviewerName', e.target.value)} style={inp} placeholder="이름" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '3px', display: 'block', fontWeight: 500 }}>Date</label>
                    <input type="date" value={form.reviewerDate} onChange={(e) => setField('reviewerDate', e.target.value)} style={inp} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──── 미리보기 탭 ──── */}
          {tab === 'preview' && (
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <div
                ref={printRef}
                style={{
                  width: '210mm', minHeight: '297mm',
                  background: '#fff', padding: '20mm 18mm',
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '11pt', color: '#000',
                  boxShadow: '0 2px 12px rgba(0,0,0,.15)',
                }}
              >
                {/* 제목 */}
                <div style={{ fontSize: '18pt', fontWeight: 'bold', textAlign: 'center', letterSpacing: '2px', marginBottom: '6mm' }}>
                  CERTIFICATE OF ANALYSIS
                </div>

                {/* ▶ Product Information */}
                <div style={{ fontSize: '10pt', fontWeight: 'bold', background: '#1a3a5c', color: '#fff', padding: '3px 8px', marginBottom: '0' }}>
                  ▶ Product Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #555', borderBottom: 'none' }}>
                  {[
                    ['Chemical Name:', form.chemicalName],
                    ['Batch Number:', form.batchNumber],
                    ['CAS Registry No.:', form.casNumber],
                    ['Manufacture Date:', form.manufactureDate],
                    ['Molecular Formula:', form.molecularFormula || '—'],
                    ['Storage Condition:', form.storageCondition],
                    ['Molecular Weight:', form.molecularWeight ? `${form.molecularWeight} g/mol` : '—'],
                    ['Quantity:', form.quantity],
                  ].map(([label, value], i) => (
                    <div key={i} style={{
                      display: 'flex', padding: '4px 8px',
                      borderBottom: '1px solid #555',
                      borderRight: i % 2 === 0 ? '1px solid #555' : 'none',
                      fontSize: '10pt',
                    }}>
                      <span style={{ fontWeight: 'bold', minWidth: '130px' }}>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  {/* Chemical Structure (full width) */}
                  <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid #555', padding: '6px 8px', minHeight: '32mm', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '130px' }}>Chemical Structure:</span>
                    {reagent.smiles
                      ? <span style={{ fontSize: '9pt', fontFamily: 'monospace', color: '#555', wordBreak: 'break-all' }}>{reagent.smiles}</span>
                      : <span style={{ color: '#999', fontSize: '9pt', fontStyle: 'italic' }}>구조식 없음 (SMILES 미등록)</span>
                    }
                  </div>
                </div>

                {/* ▶ Analysis Data */}
                <div style={{ fontSize: '10pt', fontWeight: 'bold', background: '#1a3a5c', color: '#fff', padding: '3px 8px', margin: '5mm 0 0' }}>
                  ▶ Analysis Data
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                  <thead>
                    <tr>
                      {['Test', 'Specification', 'Result'].map((h) => (
                        <th key={h} style={{ border: '1px solid #555', padding: '4px 8px', background: '#f0f0f0', textAlign: 'left', fontWeight: 'bold' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.analysisRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ border: '1px solid #555', padding: '4px 8px' }}>{row.test || '—'}</td>
                        <td style={{ border: '1px solid #555', padding: '4px 8px' }}>{row.specification || '—'}</td>
                        <td style={{ border: '1px solid #555', padding: '4px 8px' }}>{row.result || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Conclusion */}
                <div style={{ margin: '5mm 0 3mm', fontSize: '10pt', fontStyle: 'italic' }}>
                  <strong>Conclusion:</strong> {form.conclusion}
                </div>

                {/* Signatures */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4mm' }}>
                  {[
                    { label: 'Analyst Signature', name: form.analystName, date: form.analystDate },
                    { label: 'Reviewed by', name: form.reviewerName, date: form.reviewerDate },
                  ].map(({ label, name, date }) => (
                    <div key={label} style={{ border: '1px solid #999', padding: '8px', minHeight: '22mm' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '12mm' }}>{label}:</div>
                      <div style={{ borderTop: '1px solid #000', paddingTop: '2px', display: 'flex', justifyContent: 'space-between', fontSize: '9pt', color: '#333' }}>
                        <span>{name || '_______________'}</span>
                        <span>{date}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ marginTop: '8mm', textAlign: 'right', fontSize: '9pt', color: '#555', borderTop: '1px solid #ccc', paddingTop: '3mm' }}>
                  Jinuchem Co., Ltd.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button className="btn" onClick={onClose}>닫기</button>
          <button
            className="btn"
            onClick={() => setTab('preview')}
            style={{ display: tab === 'preview' ? 'none' : undefined }}
          >
            미리보기
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨 PDF 출력
          </button>
        </div>
      </div>
    </div>
  );
}
