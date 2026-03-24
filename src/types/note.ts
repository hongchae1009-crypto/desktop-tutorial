export type NoteStatus = 'draft' | 'completed' | 'signed';

export type NoteReagentRole = 'starting' | 'reagent' | 'solvent' | 'catalyst' | 'other';

export const ROLE_LABEL: Record<NoteReagentRole, string> = {
  starting: '시작물질',
  reagent:  '시약',
  solvent:  '용매',
  catalyst: '촉매',
  other:    '기타',
};

export const ROLE_COLOR: Record<NoteReagentRole, { bg: string; color: string; border: string }> = {
  starting: { bg: '#EBF5FF', color: '#185FA5', border: '#85B7EB' },
  reagent:  { bg: '#FFF7E6', color: '#92400E', border: '#FBC84A' },
  solvent:  { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  catalyst: { bg: '#F5F3FF', color: '#5B21B6', border: '#C4B5FD' },
  other:    { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' },
};

export interface NoteReagentRow {
  id: string;
  reagentId?: string;       // ReagentItem.id (시약장에서 불러온 경우)
  cabinetName?: string;
  role: NoteReagentRole;
  compoundName: string;
  alias?: string;
  casNumber?: string;
  mw?: number;
  amount: string;           // "2.5 g", "10 mL", "225 μL" 등
  mmol?: number;
  eq?: number;              // 제한 시약 대비 당량
  notes?: string;
}

export interface ProcedureStep {
  id: string;
  text: string;
}

export interface ResearchNote {
  id: string;
  noteNumber: string;              // "CE-2026-001"
  title: string;                   // 실험명
  date: string;                    // YYYY-MM-DD
  researcher: string;
  project?: string;
  status: NoteStatus;
  tags: string[];
  objective: string;               // 실험 목적
  schemeImage?: string;            // 반응 스킴 (base64 PNG)
  reagentRows: NoteReagentRow[];   // 시작물질 / 반응물 (구조화)
  procedure: ProcedureStep[];
  results: string;
  discussion: string;
  linkedMoaIds: string[];
  createdAt: string;
  updatedAt: string;
}
