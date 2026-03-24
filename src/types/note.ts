export type NoteStatus = 'draft' | 'completed' | 'signed';

export interface ProcedureStep {
  id: string;
  text: string;
}

export interface ResearchNote {
  id: string;
  title: string;
  date: string;           // YYYY-MM-DD
  researcher: string;
  project?: string;
  status: NoteStatus;
  tags: string[];
  objective: string;      // 실험 목적
  materials: string;      // 사용 시약 및 재료
  procedure: ProcedureStep[];  // 실험 방법 (단계별)
  results: string;        // 실험 결과
  discussion: string;     // 고찰
  linkedMoaIds: string[]; // 연결된 모아실험 IDs (추후 연동)
  createdAt: string;
  updatedAt: string;
}
