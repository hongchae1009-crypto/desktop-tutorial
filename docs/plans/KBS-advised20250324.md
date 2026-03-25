# Jinunote 개선 계획서

> 문서번호: KBS-advised20250324
> 작성일: 2026-03-24
> 상태: 계획 수립 완료 / 미실행
> 근거: GTC 2025 Jensen Huang 스피치 + 현 프로젝트 분석

---

## 배경 및 목적

Jensen Huang(NVIDIA CEO)의 GTC 2025 키노트에서 핵심 메시지:
> *"데이터를 실행 가능한 기술(executable skills)로 취급하라"*

Jinunote는 SMILES 기반 화합물 시스템을 보유하고 있으며,
이를 AI 반응 예측 데이터베이스로 발전시킬 구체적 로드맵이 필요하다.

---

## 현황 진단

| 항목 | 현재 상태 | 비고 |
|-----|---------|------|
| SMILES 저장 | ✅ 구현됨 | `ReagentItem.smiles` 필드 존재, 21개 중 2개만 값 있음 |
| SMILES 렌더링 | ❌ 미구현 | `StructureBox.tsx` 빈 플레이스홀더만 표시 |
| PubChem API | ✅ 구현됨 | `src/utils/pubchem.ts` — CAS → 화합물명·MW·SMILES 자동 조회 |
| 화학 렌더링 라이브러리 | ❌ 미설치 | `smiles-drawer` 패키지 없음 |
| 반응 조건 데이터 | ❌ 미캡처 | 온도·시간·분위기 필드 없음 |
| 스펙트럼 데이터 | ❌ 미캡처 | NMR peak, LCMS m/z 필드 없음 |
| 수율 추적 | ✅ 구현됨 | yield%, mg, purity 있음 |
| AI 내보내기 | ❌ 미구현 | 실험 데이터 → AI 프롬프트 변환 없음 |

---

## 개선 계획

### Phase 1: 즉시 적용 가능 (각 1~4시간)

#### 1-A. SMILES 구조식 렌더링 활성화
- **목적**: 화합물 카드에 2D 구조식 표시
- **방법**: `smiles-drawer` npm 패키지 설치 후 `StructureBox.tsx` 수정
- **대상 파일**: `src/pages/Reagent/components/StructureBox.tsx`
- **예상 소요**: 1~2시간
- **의존성**: `npm install smiles-drawer`

```typescript
// StructureBox.tsx 변경 방향
import SmilesDrawer from 'smiles-drawer';

useEffect(() => {
  if (smiles && canvasRef.current) {
    const drawer = new SmilesDrawer.Drawer({ width: 200, height: 150 });
    SmilesDrawer.parse(smiles, (tree) => drawer.draw(tree, canvasRef.current, 'light'));
  }
}, [smiles]);
```

---

#### 1-B. AI 컨텍스트 내보내기 버튼
- **목적**: 실험 데이터를 Claude/ChatGPT에 즉시 붙여넣을 수 있는 구조화된 프롬프트로 변환
- **위치**: 모아실험 상세 페이지 우상단
- **신규 파일**: `src/utils/aiExport.ts`
- **연결 파일**: `src/pages/MoaExperiment/MoaDetailView.tsx`
- **예상 소요**: 4시간

**생성 프롬프트 포맷**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 AI 상담용 실험 요약
━━━━━━━━━━━━━━━━━━━━━━━━━━
반응명: {실험명}
기질: {시작물질명} (SMILES: {smiles}, {mmol} mmol, 1.0 eq)
시약: {시약명} ({eq} eq)
촉매: {촉매명} ({eq} eq)
용매: {용매명/비율}
최고 수율: {yield}%

질문: [사용자 입력]
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

#### 1-C. PubChem 자동완성 확장
- **목적**: SMILES 자동 수집 범위 확대 (현재 RegisterModal에서만 동작)
- **기존 유틸 재사용**: `src/utils/pubchem.ts`
- **추가 연결 대상**:
  - `src/pages/MoaExperiment/components/modals/ReagentSearchModal.tsx`
  - `src/pages/Note/components/MaterialsTable.tsx`
- **예상 소요**: 2~3시간

---

### Phase 2: 스키마 확장 (1~2주)

#### 2-A. 반응 조건 필드 추가 (AI 학습 핵심 데이터)

```typescript
// src/types/moa.ts 에 추가
export interface ReactionConditions {
  temperature?: number;         // °C (예: -78, 0, 25, 100)
  reactionTime?: number;        // 시간 (예: 1, 12, 24)
  solvent?: string;             // "THF" | "DCM" | "Toluene" 등
  solventVolume?: number;       // mL
  atmosphere?: 'N2' | 'Ar' | 'Air' | 'H2';
  concentration?: number;       // mmol/mL (기질 농도)
  scale?: number;               // mmol (기준 시약)
}
```

- **UI 추가**: MoaDetailView에 반응 조건 입력 섹션
- **대상 파일**: `src/types/moa.ts`, `src/pages/MoaExperiment/MoaDetailView.tsx`

---

#### 2-B. 분석 데이터 필드 추가

```typescript
// src/types/moa.ts 에 추가
export interface AnalyticsData {
  productSmiles?: string;        // 생성물 SMILES
  lcmsMz?: number;               // LCMS m/z 값
  nmrSolvent?: string;           // CDCl3, DMSO-d6 등
  hplcRetention?: number;        // retention time (분)
  chromatographySystem?: string; // 컬럼 조건 (예: Hex:EA 9:1)
  rfValue?: number;              // TLC Rf 값
}
```

---

#### 2-C. InChIKey 필드 추가

```typescript
// src/types/reagent.ts ReagentItem에 추가
inchiKey?: string;  // 분자 고유 식별자 (중복 제거용)
```

- PubChem API에서 InChIKey도 함께 조회 (`src/utils/pubchem.ts` 확장)

---

### Phase 3: AI 데이터베이스 구축 (1~3개월)

#### 3-A. 반응 SMILES 자동 생성
- 시작물질 SMILES + 시약 SMILES + 생성물 SMILES → 표준 반응 SMILES 조합
- 포맷: `"reactant1.reactant2>reagents>product"`

#### 3-B. AI 학습용 데이터 내보내기
- 전체 실험을 JSON/CSV로 내보내기
- AI 학습용 포맷:

```json
{
  "reactionSmiles": "C1=CC2=NC=CC=C2C=C1Br.B(O)(O)c1ccccc1>>C1=CC2=NC=CC=C2C=C1c1ccccc1",
  "conditions": {
    "temperature": 100,
    "solvent": "Toluene/EtOH/H2O",
    "time": 12,
    "atmosphere": "N2"
  },
  "reagents": [
    {"smiles": "Pd(PPh3)4_SMILES", "eq": 0.05, "name": "Pd(PPh₃)₄"},
    {"smiles": "[K+].[K+].[O-]C([O-])=O", "eq": 3.0, "name": "K₂CO₃"}
  ],
  "yield": 84.8,
  "purity": null
}
```

#### 3-C. 외부 AI API 연동
- **단기**: Anthropic Claude API로 실험 데이터 기반 조건 최적화 질의
- **중기**: IBM RXN for Chemistry (반응 예측 특화)
- **장기**: ChemBERTa 파인튜닝 (자체 데이터 1,000건 이상 필요)

#### 3-D. 자체 예측 모델 (6개월~)
- 반응 수율 예측: Morgan Fingerprint (ECFP4/6) + Random Forest
- 최적 조건 추천: Bayesian Optimization
- 유사 반응 검색: Tanimoto 유사도 기반 인덱싱

---

## 구현 우선순위 및 일정표

| 순위 | 작업 | Phase | 예상 소요 | AI 기여도 | 상태 |
|-----|-----|-------|---------|---------|------|
| 🥇 1 | SMILES 렌더링 (SmilesDrawer) | 1-A | 2시간 | 중 (시각화) | ✅ 완료 |
| 🥈 2 | AI 컨텍스트 내보내기 버튼 | 1-B | 4시간 | 높음 | ✅ 완료 |
| 🥉 3 | PubChem 자동완성 전체 연결 | 1-C | 3시간 | 높음 | ✅ 완료 |
| 4 | 반응 조건 필드 추가 | 2-A | 1~2일 | **매우 높음** | ✅ 완료 |
| 5 | 분석 데이터 필드 추가 | 2-B | 반나절 | 높음 | ✅ 완료 |
| 6 | InChIKey 필드 추가 | 2-C | 2시간 | 중 | ✅ 완료 |
| 7 | 반응 SMILES 자동 생성 | 3-A | 2~3일 | 매우 높음 | ✅ 완료 |
| 8 | AI 학습용 JSON 내보내기 | 3-B | 2~3일 | 높음 | ✅ 완료 |
| 9 | Claude API 연동 | 3-C | 1주 | — | ✅ 완료 |
| 10 | 자체 예측 모델 | 3-D | 3개월+ | — | ⏳ 대기 |

---

## 수정 대상 파일 목록

| 파일 경로 | 변경 유형 | 내용 |
|---------|---------|------|
| `src/types/reagent.ts` | 수정 | `inchiKey?: string` 추가 |
| `src/types/moa.ts` | 수정 | `ReactionConditions`, `AnalyticsData` 타입 추가 |
| `src/utils/pubchem.ts` | 수정 | InChIKey 조회 추가, 재사용 범위 확대 |
| `src/utils/aiExport.ts` | **신규** | 실험 데이터 → AI 프롬프트 변환 유틸 |
| `src/pages/Reagent/components/StructureBox.tsx` | 수정 | SmilesDrawer canvas 렌더링 |
| `src/pages/MoaExperiment/MoaDetailView.tsx` | 수정 | 반응 조건 UI + AI 내보내기 버튼 |
| `src/pages/MoaExperiment/components/modals/ReagentSearchModal.tsx` | 수정 | PubChem 자동완성 연결 |
| `src/pages/Note/components/MaterialsTable.tsx` | 수정 | PubChem 자동완성 연결 |

---

## 검증 방법

### Phase 1 완료 기준
- [x] 시약 상세 카드에 SMILES 구조식이 2D로 렌더링됨
- [x] 모아실험 상세 페이지에 "AI와 상담" 버튼이 표시됨
- [x] 버튼 클릭 시 실험 데이터가 구조화된 텍스트로 클립보드 복사됨
- [x] MaterialsTable에서 CAS 입력 시 PubChem에서 SMILES 자동 입력됨

### Phase 2 완료 기준
- [x] moa.ts에 ReactionConditions + AnalyticsData 타입 추가됨 (2-A)
- [x] 실험 결과 행별 분석 데이터 확장 패널 추가됨 (2-B: 생성물 SMILES, LCMS m/z, NMR 용매, TLC Rf, 컬럼 조건, HPLC Rt)
- [x] ReagentItem + NoteReagentRow에 inchiKey 필드 추가됨 (2-C)
- [x] PubChem API에서 InChIKey 조회 및 저장됨 (2-C)

### Phase 3 완료 기준
- [ ] 실험 데이터 전체를 JSON으로 내보내기 가능
- [ ] 내보낸 JSON이 `reactionSmiles + conditions + yield` 포맷을 준수함

---

## 결론

Jinunote는 SMILES 기반 데이터 인프라가 이미 갖춰져 있다.
AI 데이터베이스 구축의 최대 병목은 **반응 조건(온도·시간·용매)의 부재**이며,
이를 먼저 해결하면 본격적인 AI 연동이 가능해진다.

> **GTC 2025 연결고리**
> Jensen Huang의 "데이터를 실행 가능한 기술로 취급하라"는 메시지는
> Jinunote의 SMILES + 실험 데이터를 AI 반응 최적화 엔진의 원료로
> 전환하는 것과 직접 연결된다.
