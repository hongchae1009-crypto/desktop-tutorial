import { useState, useMemo } from 'react';
import type { NoteReagentRow, NoteReagentRole, WeightUnit, VolumeUnit, MolUnit } from '@/types/note';
import { ROLE_LABEL, ROLE_COLOR } from '@/types/note';
import ReagentPickerModal from './ReagentPickerModal';
import { fetchByCas } from '@/utils/pubchem';

// ─── 단위 변환 헬퍼 ───────────────────────────────────────────────────────────

function toGrams(v: number | undefined, u: WeightUnit): number | undefined {
  if (v == null) return undefined;
  return u === 'mg' ? v / 1000 : v;
}
function fromGrams(g: number, u: WeightUnit): number {
  return u === 'mg' ? g * 1000 : g;
}
function toML(v: number | undefined, u: VolumeUnit): number | undefined {
  if (v == null) return undefined;
  if (u === 'μL') return v / 1000;
  if (u === 'L') return v * 1000;
  return v;
}
function toMmol(v: number | undefined, u: MolUnit): number | undefined {
  if (v == null) return undefined;
  if (u === 'μmol') return v / 1000;
  if (u === 'mol') return v * 1000;
  return v;
}
function fromMmol(mmol: number, u: MolUnit): number {
  if (u === 'μmol') return mmol * 1000;
  if (u === 'mol') return mmol / 1000;
  return mmol;
}

// 글로벌 단위 변환
function convertWeight(v: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return v;
  return fromGrams(toGrams(v, from)!, to);
}
function convertVol(v: number, from: VolumeUnit, to: VolumeUnit): number {
  if (from === to) return v;
  const ml = toML(v, from)!;
  if (to === 'μL') return ml * 1000;
  if (to === 'L') return ml / 1000;
  return ml;
}
function convertMol(v: number, from: MolUnit, to: MolUnit): number {
  if (from === to) return v;
  return fromMmol(toMmol(v, from)!, to);
}

// 숫자 포맷 (불필요한 0 제거)
function fmt(v: number | undefined, dec = 5): string {
  if (v == null || isNaN(v)) return '';
  return parseFloat(v.toFixed(dec)).toString();
}

// ─── 자동계산 ─────────────────────────────────────────────────────────────────

interface Calc {
  weight?: number;        // 표시용 weight (auto or manual)
  mol?: number;           // 표시용 mol (auto or manual)
  eq?: number;            // 항상 자동계산
  weightAuto: boolean;    // weight가 density×vol로 자동계산됨
  molAuto: boolean;       // mol이 weight÷MW로 자동계산됨
}

function calcRow(
  row: NoteReagentRow,
  wUnit: WeightUnit,
  mUnit: MolUnit,
  limitingMmol: number | undefined,
): Calc {
  // ① density × vol → weight
  const volML = toML(row.volume, row.volumeUnit);
  let weight = row.weight;
  let weightAuto = false;
  if (row.density && row.density > 0 && volML != null && volML > 0) {
    weight = fromGrams(row.density * volML, wUnit);
    weightAuto = true;
  }

  // ② weight ÷ MW → mol
  const wG = toGrams(weight, wUnit);
  let mol = row.mol;
  let molAuto = false;
  if (wG != null && wG > 0 && row.mw && row.mw > 0) {
    mol = parseFloat(fromMmol((wG / row.mw) * 1000, mUnit).toFixed(6));
    molAuto = true;
  }

  // ③ mol ÷ limiting_mol → eq
  const mmol = toMmol(mol, mUnit);
  let eq: number | undefined;
  if (row.isLimiting) {
    eq = 1;
  } else if (mmol != null && limitingMmol != null && limitingMmol > 0) {
    eq = parseFloat((mmol / limitingMmol).toFixed(4));
  }

  return { weight, mol, eq, weightAuto, molAuto };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  rows: NoteReagentRow[];
  onChange: (rows: NoteReagentRow[]) => void;
}

// ─── MaterialsTable ───────────────────────────────────────────────────────────

export default function MaterialsTable({ rows, onChange }: Props) {
  const [wUnit, setWUnit] = useState<WeightUnit>('mg');
  const [vUnit, setVUnit] = useState<VolumeUnit>('mL');
  const [mUnit, setMUnit] = useState<MolUnit>('mmol');
  const [showPicker, setShowPicker] = useState(false);

  // 제한 시약 mmol 계산
  const limitingMmol = useMemo(() => {
    const lr = rows.find((r) => r.isLimiting);
    if (!lr) return undefined;
    const { mol } = calcRow(lr, wUnit, mUnit, undefined);
    return toMmol(mol, mUnit);
  }, [rows, wUnit, mUnit]);

  function updateRow(id: string, patch: Partial<NoteReagentRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRow(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }
  function setLimiting(id: string) {
    onChange(rows.map((r) => ({ ...r, isLimiting: r.id === id })));
  }

  function addRow(role: NoteReagentRole) {
    const newRow: NoteReagentRow = {
      id: `rr_${Date.now()}`,
      role,
      compoundName: '',
      weightUnit: wUnit,
      volumeUnit: vUnit,
      molUnit: mUnit,
      atm: 1,
      isLimiting: false,
    };
    onChange([...rows, newRow]);
  }

  function addFromReagent(newRows: NoteReagentRow[]) {
    const normalized = newRows.map((r) => ({
      ...r,
      weightUnit: wUnit,
      volumeUnit: vUnit,
      molUnit: mUnit,
    }));
    onChange([...rows, ...normalized]);
  }

  // 글로벌 단위 변경 → 모든 행 값 변환
  function changeWUnit(u: WeightUnit) {
    onChange(
      rows.map((r) => ({
        ...r,
        weight: r.weight != null ? parseFloat(convertWeight(r.weight, wUnit, u).toFixed(6)) : undefined,
        weightUnit: u,
      })),
    );
    setWUnit(u);
  }
  function changeVUnit(u: VolumeUnit) {
    onChange(
      rows.map((r) => ({
        ...r,
        volume: r.volume != null ? parseFloat(convertVol(r.volume, vUnit, u).toFixed(6)) : undefined,
        volumeUnit: u,
      })),
    );
    setVUnit(u);
  }
  function changeMUnit(u: MolUnit) {
    onChange(
      rows.map((r) => ({
        ...r,
        mol: r.mol != null ? parseFloat(convertMol(r.mol, mUnit, u).toFixed(6)) : undefined,
        molUnit: u,
      })),
    );
    setMUnit(u);
  }

  return (
    <div>
      {/* 테이블 */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--bd)', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 780 }}>
          <colgroup>
            <col style={{ width: 34 }} />
            <col style={{ width: 68 }} />
            <col />
            <col style={{ width: 62 }} />
            <col style={{ width: 78 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 82 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 50 }} />
            <col style={{ width: 58 }} />
            <col style={{ width: 78 }} />
            <col style={{ width: 32 }} />
          </colgroup>
          <thead>
            <tr style={{ background: 'var(--bg2)', borderBottom: '2px solid var(--bd)' }}>
              <Th />
              <Th>PIN</Th>
              <Th align="left">NAME</Th>
              <Th>MW</Th>
              <Th>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx3)' }}>Density </span>
                <UnitBadge unit="g/mL" />
              </Th>
              <Th>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx3)' }}>Weight </span>
                <UnitSelect
                  value={wUnit}
                  options={['mg', 'g']}
                  onChange={(u) => changeWUnit(u as WeightUnit)}
                />
              </Th>
              <Th>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx3)' }}>Vol </span>
                <UnitSelect
                  value={vUnit}
                  options={['μL', 'mL', 'L']}
                  onChange={(u) => changeVUnit(u as VolumeUnit)}
                />
              </Th>
              <Th>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx3)' }}>n </span>
                <UnitSelect
                  value={mUnit}
                  options={['μmol', 'mmol', 'mol']}
                  onChange={(u) => changeMUnit(u as MolUnit)}
                />
              </Th>
              <Th>atm</Th>
              <Th>Eq</Th>
              <Th align="left">Etc.</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  style={{ padding: '28px', textAlign: 'center', color: 'var(--tx3)', fontSize: 12 }}
                >
                  시약을 추가하세요
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const calc = calcRow(row, wUnit, mUnit, limitingMmol);
                return (
                  <MatRow
                    key={row.id}
                    row={row}
                    calc={calc}
                    wUnit={wUnit}
                    isOdd={idx % 2 === 1}
                    onSetLimiting={() => setLimiting(row.id)}
                    onChange={(patch) => updateRow(row.id, patch)}
                    onRemove={() => removeRow(row.id)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 추가 버튼 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <AddBtn onClick={() => addRow('starting')}>+ Add Molecule</AddBtn>
        <AddBtn onClick={() => addRow('solvent')}>+ Add Solvent</AddBtn>
        <AddBtn
          onClick={() => setShowPicker(true)}
          style={{ background: 'var(--blue-bg)', color: 'var(--blue)', borderColor: 'var(--blue)' }}
        >
          📦 시약장에서 추가
        </AddBtn>
      </div>

      {showPicker && (
        <ReagentPickerModal onAdd={addFromReagent} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}

// ─── 행 컴포넌트 ─────────────────────────────────────────────────────────────

interface MatRowProps {
  row: NoteReagentRow;
  calc: Calc;
  wUnit: WeightUnit;
  isOdd: boolean;
  onSetLimiting: () => void;
  onChange: (patch: Partial<NoteReagentRow>) => void;
  onRemove: () => void;
}

function MatRow({ row, calc, wUnit: _wUnit, isOdd, onSetLimiting, onChange, onRemove }: MatRowProps) {
  const [casInput, setCasInput] = useState(row.casNumber ?? '');
  const [casLoading, setCasLoading] = useState(false);

  async function handleCasLookup() {
    const cas = casInput.trim();
    if (!cas) return;
    setCasLoading(true);
    const result = await fetchByCas(cas);
    setCasLoading(false);
    if (result) {
      onChange({
        casNumber: cas,
        ...(result.compoundName ? { compoundName: result.compoundName } : {}),
        ...(result.mw != null ? { mw: result.mw } : {}),
      });
    }
  }
  const bg = row.isLimiting ? '#EBF9F1' : isOdd ? 'var(--bg2)' : 'transparent';

  const td: React.CSSProperties = {
    borderBottom: '1px solid var(--bd)',
    background: bg,
    verticalAlign: 'middle',
    padding: '2px 4px',
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '5px 6px', fontSize: 11,
    border: '1px solid transparent', borderRadius: 4,
    background: 'transparent', color: 'var(--tx)',
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color .12s, background .12s',
    textAlign: 'right', boxSizing: 'border-box',
  };
  const autoInp: React.CSSProperties = {
    ...inp,
    background: '#EBF5FF',
    color: '#185FA5',
    cursor: 'default',
  };

  const onF = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--blue-bd, #b5d4f4)';
    e.currentTarget.style.background = '#fff';
  };
  const onB = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'transparent';
    e.currentTarget.style.background = 'transparent';
  };

  const role = row.role;
  const rc = role ? ROLE_COLOR[role] : undefined;

  return (
    <tr>
      {/* 라디오 (제한 시약) */}
      <td style={{ ...td, textAlign: 'center', padding: '2px 8px' }}>
        <button
          onClick={onSetLimiting}
          title="제한 시약으로 설정"
          style={{
            width: 16, height: 16, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
            border: `2px solid ${row.isLimiting ? 'var(--blue)' : 'var(--bd2)'}`,
            background: row.isLimiting ? 'var(--blue)' : 'transparent',
            padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {row.isLimiting && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
          )}
        </button>
      </td>

      {/* PIN */}
      <td style={{ ...td }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--tx3)', paddingLeft: 4 }}>
          {row.pinCode ?? '—'}
        </span>
      </td>

      {/* NAME */}
      <td style={{ ...td }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              value={row.compoundName}
              onChange={(e) => onChange({ compoundName: e.target.value })}
              placeholder="화합물명"
              style={{ ...inp, textAlign: 'left', flex: 1, minWidth: 0 }}
              onFocus={onF} onBlur={onB}
            />
            {rc && role && (
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 8, flexShrink: 0,
                background: rc.bg, color: rc.color, border: `0.5px solid ${rc.border}`, fontWeight: 600,
              }}>
                {ROLE_LABEL[role]}
              </span>
            )}
          </div>
          {/* CAS 조회 행 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <input
              value={casInput}
              onChange={(e) => setCasInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCasLookup()}
              placeholder="CAS 번호"
              style={{ ...inp, textAlign: 'left', flex: 1, minWidth: 0, fontSize: 10, color: 'var(--tx3)', padding: '2px 5px' }}
              onFocus={onF} onBlur={onB}
            />
            <button
              onClick={handleCasLookup}
              disabled={casLoading}
              title="PubChem에서 화합물 정보 자동완성"
              style={{
                flexShrink: 0, fontSize: 9, padding: '2px 5px', borderRadius: 4, cursor: 'pointer',
                border: '1px solid var(--blue-bd, #b5d4f4)', background: '#e8f0fa', color: '#1a6bb5',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              {casLoading ? '…' : '조회'}
            </button>
          </div>
          {row.cabinetName && (
            <div style={{ fontSize: 9, color: 'var(--tx3)', paddingLeft: 4, marginTop: 1 }}>
              📦 {row.cabinetName}
            </div>
          )}
        </div>
      </td>

      {/* MW */}
      <td style={{ ...td }}>
        <input
          type="number"
          value={row.mw ?? ''}
          onChange={(e) => onChange({ mw: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="—"
          style={inp}
          onFocus={onF} onBlur={onB}
        />
      </td>

      {/* Density */}
      <td style={{ ...td }}>
        <input
          type="number"
          value={row.density ?? ''}
          onChange={(e) => onChange({ density: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="0"
          step="0.001"
          style={inp}
          onFocus={onF} onBlur={onB}
        />
      </td>

      {/* Weight */}
      <td style={{ ...td }}>
        {calc.weightAuto ? (
          <input
            readOnly
            value={fmt(calc.weight, 4)}
            style={autoInp}
            title="density × vol 자동계산"
          />
        ) : (
          <input
            type="number"
            value={row.weight ?? ''}
            onChange={(e) => onChange({ weight: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="0"
            style={inp}
            onFocus={onF} onBlur={onB}
          />
        )}
      </td>

      {/* Volume */}
      <td style={{ ...td }}>
        <input
          type="number"
          value={row.volume ?? ''}
          onChange={(e) => onChange({ volume: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="0"
          step="0.001"
          style={inp}
          onFocus={onF} onBlur={onB}
        />
      </td>

      {/* n (mol) */}
      <td style={{ ...td }}>
        {calc.molAuto ? (
          <input
            readOnly
            value={fmt(calc.mol, 4)}
            style={autoInp}
            title="weight ÷ MW 자동계산"
          />
        ) : (
          <input
            type="number"
            value={row.mol ?? ''}
            onChange={(e) => onChange({ mol: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="0"
            step="0.001"
            style={inp}
            onFocus={onF} onBlur={onB}
          />
        )}
      </td>

      {/* atm */}
      <td style={{ ...td }}>
        <input
          type="number"
          value={row.atm}
          onChange={(e) => onChange({ atm: e.target.value ? parseFloat(e.target.value) : 1 })}
          step="0.1"
          style={inp}
          onFocus={onF} onBlur={onB}
        />
      </td>

      {/* Eq */}
      <td style={{ ...td }}>
        <input
          readOnly
          value={calc.eq != null ? fmt(calc.eq, 3) : '—'}
          style={{
            ...autoInp,
            background: row.isLimiting ? '#d4f5e2' : '#EBF5FF',
            color: row.isLimiting ? '#0F6E56' : '#185FA5',
            fontWeight: row.isLimiting ? 700 : 400,
          }}
          title="자동계산 (mol ÷ 제한시약 mol)"
        />
      </td>

      {/* Etc. */}
      <td style={{ ...td }}>
        <input
          value={row.notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="—"
          style={{ ...inp, textAlign: 'left' }}
          onFocus={onF} onBlur={onB}
        />
      </td>

      {/* 삭제 */}
      <td style={{ ...td, textAlign: 'center', padding: '2px 4px' }}>
        <button
          onClick={onRemove}
          style={{
            width: 22, height: 22, borderRadius: 4, cursor: 'pointer',
            border: 'none', background: '#DC2626', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}
        >
          <svg width="11" height="12" viewBox="0 0 11 12" fill="none">
            <path d="M1.5 3h8M4.5 3V1.5h2V3M3 3v7.5h5V3H3z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </td>
    </tr>
  );
}

// ─── 서브 UI ─────────────────────────────────────────────────────────────────

function Th({ children, align = 'right' }: { children?: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th style={{
      padding: '7px 6px', fontWeight: 600, color: 'var(--tx3)',
      fontSize: 10, letterSpacing: '.04em', textAlign: align,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

function UnitBadge({ unit }: { unit: string }) {
  return (
    <span style={{
      fontSize: 9, background: '#E8F0FA', color: 'var(--blue)',
      padding: '1px 4px', borderRadius: 4, fontWeight: 600,
    }}>
      {unit}
    </span>
  );
}

function UnitSelect({ value, options, onChange }: {
  value: string; options: string[]; onChange: (u: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      onClick={(e) => e.stopPropagation()}
      style={{
        fontSize: 9, border: '1px solid var(--bd)', borderRadius: 4,
        background: '#E8F0FA', padding: '1px 2px', color: 'var(--blue)',
        fontWeight: 600, cursor: 'pointer', outline: 'none',
      }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function AddBtn({
  children, onClick, style,
}: {
  children: React.ReactNode; onClick: () => void; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
        border: '1px solid var(--bd2)', background: 'transparent', color: 'var(--tx3)',
        transition: 'background .12s',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!style?.background) (e.currentTarget as HTMLElement).style.background = 'var(--bg2)';
      }}
      onMouseLeave={(e) => {
        if (!style?.background) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}
