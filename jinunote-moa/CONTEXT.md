# Jinunote — 모아 실험 페이지 컨텍스트

> Claude Code 인계용 문서. 이 파일과 `moa_experiment_v6.html`을 함께 참고할 것.

---

## 1. 프로젝트 개요

**앱명:** Jinunote  
**페이지:** 모아 실험 (MoA Experiment)  
**목적:** 유기화학 실험 연구노트. 동일한 반응 조건에서 변수시약(E)만 바꿔가며 여러 실험(HCE)을 동시에 관리하는 페이지.

---

## 2. 페이지 구조

```
목록 뷰 (카드 그리드 4열)
  └── 카드 클릭 → 상세 뷰

상세 뷰
  ├── Topbar (← 목록 | 되돌리기 | 프린트 | 연구노트 가져오기 | 저장 | 닫기 | 삭제)
  ├── Metabar (실험번호 | 실험명 | 프로젝트 | 작성자 | 생성일)
  ├── Sidebar (내연구실 / 인벤토리 / 연구노트 메뉴)
  └── Main (세로 스크롤)
      ├── Scheme 카드 (E + A + B + C → F 반응식)
      ├── 기준물질 안내 배너
      ├── Starting 정량 테이블 카드
      │   └── 실험기록 탭 패널 (공통 + HCE별)
      ├── 실험결과 카드
      │   ├── 결과 테이블 (화합물명·Yield·수득량·mmol·순도·분석방법·첨부·등록)
      │   └── Yield 가로 막대 차트
      ├── 댓글 카드
      └── 메모 카드 (접기/펼치기)
```

---

## 3. 핵심 데이터 모델

### 3-1. 실험 행 (EXP)

```typescript
interface Exp {
  id: string;          // 'HCE-1', 'HCE-2', ...
  name: string;        // 변수시약명 (시약장 검색으로 입력)
  pin: string;         // 시약 PIN 코드
  mw: number | null;   // 분자량 (g/mol)
  eq: number;          // eq 배율 (비기준 시약일 때 사용)
  baseMmol: string;    // 기준물질일 때 직접 입력하는 mmol
  m: string;           // measures(mg) — 실제 측정값
}
```

### 3-2. 공통시약 열 (COM)

```typescript
interface Com {
  name: string;
  pin: string;
  mw: number | null;
  eq: number;          // eq 배율
  baseMmol: string;    // 기준물질일 때 직접 입력하는 mmol
  cells: Array<{ m: string }>; // 행별 measures(mg) — 인덱스 = EXP 인덱스
}
```

### 3-3. 기준물질 (baseTarget)

```typescript
type BaseTarget = 'exp' | `com-${number}`;
// 'exp'   → 변수시약 E가 기준
// 'com-0' → 공통시약 0번이 기준
// 'com-1' → 공통시약 1번이 기준
```

### 3-4. 실험결과 (resData) — 행당 1개

```typescript
interface ResData {
  cpd: {
    name: string;
    pin: string;
    mw: number | null;
    registered: boolean;  // 시약장 등록 완료 여부
  };
  yield: string;    // Yield %
  mg: string;       // 수득량(mg)
  pur: string;      // 순도 %
  meth: string;     // 분석방법 (LCMS/NMR/HPLC/GC)
}
```

---

## 4. 핵심 계산 로직

### 4-1. 기준물질 mmol 가져오기

```typescript
function getBaseMmol(ri: number): number {
  if (baseTarget === 'exp') return parseFloat(EXP[ri].baseMmol) || 0;
  const ci = parseInt(baseTarget.replace('com-', ''));
  return parseFloat(COM[ci].baseMmol) || 0;
}
```

### 4-2. 자동 mmol·weight 계산 (비기준 시약)

```
mmol  = baseMmol × eq
weight(mg) = mmol × MW
```

```typescript
const autoMmol = (baseMmol: number, eq: number): string | null =>
  baseMmol && eq ? (baseMmol * eq).toFixed(4) : null;

const calcWeight = (mmol: string | null, mw: number | null): string | null =>
  mmol && mw ? (parseFloat(mmol) * mw).toFixed(2) : null;
```

### 4-3. 오차율 계산

```
오차율(%) = (measures - planWeight) / planWeight × 100
```

| 범위 | 뱃지 클래스 | 셀 배경 |
|------|------------|--------|
| ±5% 이내 | `badge-ok` | 없음 |
| ±5~10% | `badge-warn` | `#fff8ee` |
| 10% 초과 | `badge-err` | `#fff0f0` |

```typescript
function getDeviation(planWeight: number, measures: string) {
  const m = parseFloat(measures);
  if (!measures || isNaN(m) || !planWeight) return null;
  const r = (m - planWeight) / planWeight * 100;
  const s = (r >= 0 ? '+' : '') + r.toFixed(1) + '%';
  if (Math.abs(r) <= 5)  return { badge: 'ok',   label: s, bgCell: '' };
  if (Math.abs(r) <= 10) return { badge: 'warn', label: s, bgCell: '#fff8ee' };
  return { badge: 'err', label: s, bgCell: '#fff0f0' };
}
```

### 4-4. 실험결과 mmol 자동계산

```
mmol = 수득량(mg) / MW
```

```typescript
function calcResultMmol(mg: string, mw: number | null): string | null {
  const m = parseFloat(mg);
  if (!mg || isNaN(m) || m <= 0 || !mw) return null;
  return (m / mw).toFixed(4);
}
```

---

## 5. 테이블 구조 (colspan 검증 완료)

### Starting 정량 테이블

**헤더 구조:**
```
1단: 실험번호(rowspan=2) | 시약명E(1열) | E정량(colspan ec) | [시약명C(rowspan=N) | C정량(colspan cc)] × comN
2단:                       E서브(ec열)                         [C서브(cc열)] × comN
```

**colspan 공식:**
```
refOn=ON  → ec = cc = 4  (eq + mmol + weight + measure)
refOn=OFF → ec = cc = 2  (weight + measure 만)
```

**검증 공식 (전 케이스 통과 ✓):**
```
h1    = 1 + (1+ec) + comN×(1+cc)   // 1단 총 열 수
b_r0  = 1 + 1 + ec + comN×(1+cc)   // 바디 ri=0 td 수
b_rN  = 1 + 1 + ec + comN×cc       // 바디 ri>0 (COM시약명 rowspan으로 없음)
h1 === b_r0  →  항상 ✓
```

**시약명 셀 rowspan 규칙:**
- **E 시약명**: 1단 1열, rowspan 없음 (매 행 렌더)
- **COM 시약명**: 1단 1열, `rowspan={EXP.length}` — ri===0 에서만 렌더
- 라디오 버튼은 COM 시약명 셀 **내부 왼쪽**에 인라인 배치

**기준물질일 때 셀 변화:**
- eq 칸: `1.00` 고정 표시 (입력 불가)
- mmol 칸: 직접 입력 (주황 테두리 강조)
- weight 칸: mmol × MW 자동 (읽기 전용)

**비기준일 때 셀:**
- eq 칸: 입력 가능
- mmol 칸: `baseMmol × eq` 자동 (읽기 전용)
- weight 칸: `mmol × MW` 자동 (읽기 전용)

### 실험결과 테이블 (9열, colspan/rowspan 없음)

```
실험번호 | 화합물명+PIN/MW | Yield% | 수득량(mg) | mmol(자동) | 순도% | 분석방법 | 첨부파일 | 등록
```

---

## 6. 기준물질 시스템

- 변수시약 E 또는 공통시약 중 **하나만** 선택 (라디오 버튼, 동일 name 그룹)
- 기준 변경 시 → undo 스택에 스냅샷 저장 후 전체 재렌더
- 변수시약 E가 기준: 각 HCE 행마다 `baseMmol` 개별 입력
- 공통시약이 기준: `COM[ci].baseMmol` 단일값 (전 행 동일)

---

## 7. Undo 시스템

- 스냅샷 대상: `EXP`, `COM`, `baseTarget`
- 최대 20단계
- 트리거: 시약 변경, 행/열 추가·삭제, mmol·eq 변경, 기준물질 변경
- 하단 토스트로 피드백 + 상단 "되돌리기" 버튼

---

## 8. 모달 목록

| ID | 트리거 | 용도 |
|----|--------|------|
| `mo-r` | 돋보기 버튼 (정량 테이블) | 시약장 검색 → EXP/COM 시약 선택 |
| `mo-cpd` | 돋보기 버튼 (결과 테이블) | 화합물 검색 → resData.cpd 연동 |
| `mo-reg` | 시약 등록 버튼 | 생성물을 시약장에 등록 |
| `prev-mo` | 첨부파일 클릭 | 이미지/PDF 미리보기 (방향키 네비) |

---

## 9. 색상 팔레트

```
Primary blue   : #1a6bb5  bg: #e8f0fa  bd: #b5d4f4
변수시약 E      : #BA7517  (orange)     bg: #faeeda
공통시약 0 (A)  : #378ADD  (blue)
공통시약 1 (B)  : #1D9E75  (green)
공통시약 2 (C)  : #7F77DD  (purple)
공통시약 3 (D)  : #EF9F27  (orange2)
공통시약 4 (E)  : #D85A30  (red-orange)

오차 OK   bg: #eaf3de  text: #3B6D11
오차 WARN bg: #faeeda  text: #633806   cell: #fff8ee
오차 ERR  bg: #fcebeb  text: #A32D2D   cell: #fff0f0
등록 완료  bg: #e2f7ee  text: #1D9E75
```

---

## 10. 미결 사항 (TODO)

- [ ] **테이블 헤더 최종 구조** — `TABLE_HEADER.md` 참조 (이미지 확정, 코드 미반영)
- [ ] Scheme 편집 (화학 구조식 드로잉)
- [ ] 시약장 API 연동 (현재 하드코딩 샘플)
- [ ] 시약 등록 API 연동 (현재 UI만)
- [ ] 모바일/태블릿 대응
- [ ] 실험기록 → 개별 랩북 반영 정책
- [ ] A4 프린트 레이아웃
- [ ] 실험번호 자동 채번 규칙 확정

---

## 11. Claude Code 시작 가이드

### 권장 파일 구조

```
src/
├── pages/MoaExperiment/
│   ├── index.tsx                  # 목록/상세 뷰 전환
│   ├── MoaListView.tsx
│   ├── MoaDetailView.tsx
│   └── components/
│       ├── QuantTable/
│       │   ├── index.tsx          # 테이블 렌더
│       │   ├── useQuantTable.ts   # 기준물질·계산 로직
│       │   └── types.ts
│       ├── ResultTable/
│       │   ├── index.tsx
│       │   └── useResultTable.ts
│       ├── RecordTabs/
│       ├── YieldChart/
│       └── modals/
│           ├── ReagentSearchModal.tsx
│           └── CompoundRegModal.tsx
├── hooks/
│   └── useUndoStack.ts
└── types/moa.ts
```

### 추천 작업 순서

1. `types/moa.ts` — 타입 정의
2. `useQuantTable.ts` — 기준물질 로직, 자동계산
3. `QuantTable/index.tsx` — 테이블 렌더 (colspan 검증 공식 엄수)
4. `ResultTable/index.tsx` — 결과 테이블
5. 나머지 컴포넌트

### 첫 메시지 예시

```
moa_experiment_v6.html, CONTEXT.md, TABLE_HEADER.md를 참고해서
React + TypeScript로 MoaExperiment 페이지를 구현해줘.
types/moa.ts부터 시작하고, QuantTable 컴포넌트의
colspan 검증 공식을 반드시 지켜줘.
```
