// ─────────────────────────────────────────────────────────────
//  Jinunote · COA (Certificate of Analysis) 타입 정의
// ─────────────────────────────────────────────────────────────

export interface CoaAnalysisRow {
  id: string;
  test: string;
  specification: string;
  result: string;
}

export interface CoaFormData {
  // Product Information (시약장에서 자동완성)
  chemicalName: string;
  batchNumber: string;
  casNumber: string;
  manufactureDate: string;   // YYYY-MM-DD
  molecularFormula: string;
  storageCondition: string;
  molecularWeight: string;
  quantity: string;

  // Analysis Data
  analysisRows: CoaAnalysisRow[];

  // Conclusion & Signatures
  conclusion: string;
  analystName: string;
  analystDate: string;
  reviewerName: string;
  reviewerDate: string;
}
