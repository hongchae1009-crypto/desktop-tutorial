# 세션 로그: 2026-03-24

> 프로젝트: Jinunote (모아실험 / 연구노트)
> Claude 지침: 모든 계획과 커뮤니케이션 내용은 MD로 저장

---

## 이번 세션에서 완료된 작업

### 1. 연구노트 (Research Note) 구현
- **노트 번호 자동 생성**: `CE-2026-001` 형식 (연구자 이니셜 + 연도 + 순번)
- **시작물질/반응물 테이블** (`MaterialsTable.tsx`):
  - 역할 배지 (시작물질/시약/용매/촉매/기타)
  - 자동계산 cascade: density×vol→weight→mol→Eq
  - 전역 단위 드롭다운 (mg/g, μL/mL/L, μmol/mmol/mol)
  - 제한시약 라디오 버튼
  - 시약장에서 바로 불러오기 (`ReagentPickerModal.tsx`)
- **반응 스킴 캔버스** (`SchemeCanvas.tsx`):
  - 자유 드로잉 (5색, 3크기)
  - 점선 격자 배경
  - 이미지 업로드 지원
- **타입 정의 완성** (`src/types/note.ts`)

### 2. GTC 2025 분석 (Plan Mode)
- Jensen Huang 스피치 vs. 현재 Jinunote 기술 현황 분석
- SMILES 기반 AI 데이터베이스 구축 3단계 로드맵 수립
- 즉시 구현 가능 항목 3개 도출
- 상세 계획: `docs/plans/GTC2025-AI-Database-Plan.md`

---

## 다음 세션 작업 예정

### 우선순위 1: SMILES 렌더링 활성화
```bash
npm install smiles-drawer
```
- 파일: `src/pages/Reagent/components/StructureBox.tsx`

### 우선순위 2: AI 컨텍스트 내보내기 버튼
- 신규 파일: `src/utils/aiExport.ts`
- 연결: `src/pages/MoaExperiment/MoaDetailView.tsx`

### 우선순위 3: PubChem 자동완성 확장
- 기존: `src/utils/pubchem.ts` (재사용)
- 연결: `MaterialsTable.tsx`, `ReagentSearchModal.tsx`

---

## Claude 작업 지침 (지속 적용)

1. **모든 계획과 커뮤니케이션 내용은 MD로 저장** (본 파일)
2. 계획 파일 위치: `docs/plans/`
3. 세션 로그 위치: `docs/sessions/`
