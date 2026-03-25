# GTC 2025 × Jinunote: 기술 적용 가능성 분석 및 AI 데이터베이스 구축 제안

> 작성일: 2026-03-24
> 작성자: Claude (Plan Mode)
> 대상 프로젝트: Jinunote (모아실험 / 연구노트)

---

## 1. 현재 기술 현황 요약

| 항목 | 현재 상태 | 비고 |
|-----|---------|------|
| SMILES 저장 | ✅ ReagentItem에 필드 있음 | 21개 중 2개만 값 있음 |
| SMILES 렌더링 | ❌ 미구현 (빈 박스만 표시) | SmilesDrawer 미설치 |
| PubChem API | ✅ `src/utils/pubchem.ts` 존재 | CAS → 화합물명·MW·SMILES 조회 |
| 화학 라이브러리 | ❌ 없음 | 의존성 없음 |
| 반응 조건 데이터 | ❌ 미캡처 | 온도·시간·용매·분위기 없음 |
| 스펙트럼 데이터 | ❌ 미캡처 | NMR peak, LCMS m/z 없음 |
| 수율 추적 | ✅ yield%, mg, purity 있음 | |

---

## 2. 적용 가능성 3단계 분류

### ✅ 즉시 적용 가능 (코드·인프라 이미 있음)

#### A. SMILES 렌더링 활성화
- **현황**: `StructureBox.tsx`에 placeholder만 있고, SmilesDrawer 미설치
- **작업**: `npm install smiles-drawer` → `StructureBox.tsx`에 canvas 렌더링 연결
- **소요**: 1~2시간
- **관련 파일**: `src/pages/Reagent/components/StructureBox.tsx`

#### B. PubChem 자동완성 확장
- **현황**: `RegisterModal`에서만 CAS → PubChem 조회 중
- **작업**: 모아실험 `ReagentSearchModal` + 연구노트 `MaterialsTable`에도 동일 기능 연결
- **소요**: 2~3시간
- **관련 파일**:
  - `src/utils/pubchem.ts` (기존 함수 재사용)
  - `src/pages/MoaExperiment/components/modals/ReagentSearchModal.tsx`
  - `src/pages/Note/components/MaterialsTable.tsx`

#### C. AI 컨텍스트 내보내기 버튼
- **위치**: 모아실험 상세 페이지 우상단
- **기능**: 현재 실험 데이터 → Claude/ChatGPT 즉시 붙여넣기 프롬프트 생성
- **소요**: 4시간
- **관련 파일**: `src/utils/aiExport.ts` (신규), `src/pages/MoaExperiment/MoaDetailView.tsx`

**생성 프롬프트 예시**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 AI 상담용 실험 요약 (복사됨)
━━━━━━━━━━━━━━━━━━━━━━━━━━
반응명: Suzuki Coupling
기질: 7-bromoquinoline (SMILES: C1=CC2=NC=CC=C2C=C1Br, 2.41 mmol, 1.0 eq)
붕산: Phenylboronic acid (1.5 eq)
촉매: Pd(PPh₃)₄ (0.05 eq)
염기: K₂CO₃ (3.0 eq)
용매: Toluene/EtOH/H₂O (4:2:1)
최고 수율: 84.8% (HCE-2)

질문: 수율을 90% 이상으로 올리려면?
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 🔧 중기 작업 (스키마 확장 필요, 1~2주)

#### D. 반응 조건 필드 추가 (AI 학습을 위한 핵심 데이터)

```typescript
// src/types/moa.ts에 추가
interface ReactionConditions {
  temperature: number;          // °C (예: -78, 0, 25, 100)
  time: number;                 // 시간 (예: 1, 12, 24)
  solvent: string;              // "THF" | "DCM" | "Toluene" 등
  solventVolume: number;        // mL
  atmosphere: 'N2' | 'Ar' | 'Air' | 'H2';
  concentration: number;        // mmol/mL (기질 농도)
  scale: number;                // mmol (기준 시약)
}

// 분석 데이터
interface AnalyticsData {
  productSmiles?: string;       // 생성물 SMILES
  lcmsMz?: number;              // LCMS m/z 값
  nmrSolvent?: string;          // CDCl3, DMSO-d6 등
  hplcRetention?: number;       // retention time (분)
  chromatographySystem?: string; // Hex:EA 9:1 등
  rfValue?: number;              // TLC Rf 값
}
```

#### E. 반응 SMILES 자동 생성
- 시작물질 SMILES들 → 반응 SMILES 포맷으로 조합
- 형식: `"reactant1.reactant2>reagents>product"`

---

### 🏗️ 장기 아키텍처 (AI 데이터베이스 구축, 1~3개월)

#### Stage 1: 구조화된 로컬 데이터 (현재 → 3개월)
```
현재: 분산된 상태관리 (Zustand + 로컬스토리지)
목표: 정규화된 JSON 스키마로 내보내기 가능한 구조

핵심 작업:
1. ReagentItem에 InChIKey 필드 추가 (중복 제거)
2. 실험 기록에 ReactionConditions + AnalyticsData 필드 추가
3. 전체 실험을 JSON/CSV로 내보내는 "AI 학습용 내보내기" 기능
```

**AI 학습용 내보내기 JSON 포맷**:
```json
{
  "reactionSmiles": "C1CC(=O)NC2=C1C=CC(=C2)OCC>>product_SMILES",
  "conditions": {
    "temperature": -78,
    "solvent": "THF",
    "time": 3,
    "atmosphere": "N2"
  },
  "reagents": [
    {"smiles": "[K+].CCCC[N-]...", "eq": 1.2, "name": "KHMDS"}
  ],
  "yield": 68.5,
  "purity": 95
}
```

#### Stage 2: 외부 AI API 연동 (3~6개월)
- **옵션 A**: Anthropic Claude API — 실험 데이터를 컨텍스트로 제공, 즉시 적용 가능
- **옵션 B**: IBM RXN for Chemistry — 화학 반응 예측 특화 API
- **옵션 C**: 오픈소스 ChemBERTa, Reaction-T5 (데이터 1,000+ 반응 필요)

#### Stage 3: 자체 AI 모델 (6개월~)
```
충분한 실험 데이터 축적 후:
  ├── 반응 수율 예측 모델 (Morgan FP + Random Forest)
  ├── 최적 조건 추천 (Bayesian Optimization)
  └── 유사 반응 검색 (Tanimoto 유사도 기반)
```

---

## 3. SMILES가 AI의 핵심인 이유

```
SMILES
  ↓ (변환)
분자 표현 → 머신러닝 입력
  ├── Morgan Fingerprint (ECFP4/6): 분자 유사도 계산
  ├── Graph Neural Network: 원자·결합 그래프로 성질 예측
  └── Transformer (ChemBERTa): 자연어처럼 분자 "문장" 처리

실험 데이터
  ├── 입력: 시작물질 SMILES + 조건 (온도, 용매, 시간)
  └── 출력: 수율(%), 순도(%), 생성물 SMILES
```

---

## 4. 구현 우선순위

| 우선순위 | 작업 | 소요 | 즉시 가능? | AI 데이터 기여 |
|--------|-----|-----|-----------|-------------|
| 🥇 1 | SMILES 렌더링 (SmilesDrawer) | 2시간 | ✅ | 중 (시각화) |
| 🥈 2 | AI 컨텍스트 내보내기 버튼 | 4시간 | ✅ | 높음 |
| 🥉 3 | PubChem 자동완성 전체 연결 | 3시간 | ✅ | 높음 (SMILES 자동 수집) |
| 4 | 반응 조건 필드 추가 | 1~2일 | 🔧 | **매우 높음** (AI 핵심) |
| 5 | 반응 SMILES 생성 | 2~3일 | 🔧 | 매우 높음 |
| 6 | AI 학습용 JSON 내보내기 | 2~3일 | 🔧 | 높음 |
| 7 | Claude/외부 AI API 연동 | 1주 | 🏗️ | — |
| 8 | 자체 예측 모델 | 3개월+ | 🏗️ | — |

---

## 5. 수정이 필요한 핵심 파일

| 파일 | 변경 내용 |
|-----|---------|
| `src/types/moa.ts` | ReactionConditions 타입 추가 |
| `src/types/reagent.ts` | InChIKey 필드 추가 |
| `src/pages/Reagent/components/StructureBox.tsx` | SmilesDrawer 연동 |
| `src/utils/pubchem.ts` | 기존 활용 확대 (재사용) |
| `src/pages/MoaExperiment/MoaDetailView.tsx` | 조건 입력 UI + AI 내보내기 버튼 |
| `src/utils/aiExport.ts` | 신규: 실험 → AI 프롬프트 변환 유틸 |

---

## 6. 핵심 결론

1. **SMILES 기반 시스템이 이미 준비됨** — 렌더링만 활성화하면 즉시 구조식 표시 가능
2. **AI 데이터 구축의 최대 병목은 반응 조건** — 온도·시간·용매가 없으면 AI 학습 불가
3. **단기 고효율 전략**: PubChem으로 SMILES 자동 채우기 + AI 내보내기 버튼
4. **장기 전략**: 반응 조건 필드 확충 → 데이터 100건 이상 축적 → 외부 AI API 연동

### GTC 2025와의 연결고리
> Jensen Huang: *"데이터를 실행 가능한 기술(executable skills)로 취급하라"*

Jinunote의 SMILES + 실험 데이터 = 반응 최적화 AI의 원료.
반응 조건 필드를 추가하는 것이 AI 시대로의 **첫 번째 실질적 전환점**.
