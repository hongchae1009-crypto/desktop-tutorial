# Starting 정량 테이블 — 헤더 최종 구조

> 이미지로 확정된 구조. v6 HTML에는 아직 미반영 — 코드 구현 시 이 문서 기준으로 작성할 것.

---

## 확정된 헤더 구조 (이미지 기준)

### 참고값 ON (refOn = true)

```
┌────────┬──────────────────────────────────────────────┬─────────────────────────────────────────────┐
│        │  ○ 변수시약                                   │  ○ 시약명  🔍  ×                            │
│실험번호│  (라디오 + "변수시약" 텍스트)                  │  (라디오 + 시약명 + 돋보기 + 삭제)           │
│(row=2) ├───────────┬───────────────────────────────────┼───┬─────────────────────────────────────────┤
│        │  시약명   │    eq   │  mmol  │weight│measure  │eq │  mmol  │  weight(mg)  │  measure(mg)   │
│        │  PIN MW   │         │        │ (mg) │  (mg)   │   │        │              │                │
└────────┴───────────┴─────────┴────────┴──────┴─────────┴───┴────────┴──────────────┴────────────────┘
```

### 참고값 OFF (refOn = false)

```
┌────────┬──────────────────────┬───────────────────────────────┐
│        │  ○ 변수시약          │  ○ 시약명  🔍  ×              │
│실험번호│  (라디오 + 텍스트)   │  (라디오 + 시약명 + 돋보기)   │
│(row=2) ├──────────┬───────────┼──────────────┬────────────────┤
│        │  시약명  │weight(mg) │  measure(mg) │  weight(mg)    │...
│        │  PIN MW  │           │              │                │
└────────┴──────────┴───────────┴──────────────┴────────────────┘
```

---

## 헤더 셀 상세 설명

### 1단 헤더

| 셀 | rowspan | colspan | 내용 |
|----|---------|---------|------|
| 실험번호 | 2 | 1 | 텍스트 "실험번호" |
| E 라디오+텍스트 | 1 | 1 | `○ 변수시약` (라디오 + 텍스트, 기준일 때 "기준" 뱃지) |
| E 정량 그룹 | 1 | ec | "변수시약" (colspan = ec) |
| COM 시약명+라디오 | 1 | 1 | `○ 시약명 🔍 ×` (라디오 + 실제 시약명 + 돋보기 + 삭제버튼) |
| COM 정량 그룹 | 1 | cc | 실제 시약명 + PIN·MW 서브텍스트 (colspan = cc) |

### 2단 헤더

| 셀 | 내용 |
|----|------|
| E 시약명 | 실제 시약명 (굵게) + PIN·MW (작게, 이탤릭) |
| E eq | "eq" (refOn=ON 시만) |
| E mmol | "mmol" (refOn=ON 시만) |
| E weight | "weight(mg)" |
| E measure | "measure(mg)" |
| COM 시약명 | 실제 시약명 (굵게) + PIN·MW (작게, 이탤릭) |
| COM eq | "eq" (refOn=ON 시만) |
| COM mmol | "mmol" (refOn=ON 시만) |
| COM weight | "weight(mg)" |
| COM measure | "measure(mg)" |

---

## colspan 검증 공식

```typescript
const ec = refOn ? 4 : 2;  // E 정량 colspan
const cc = refOn ? 4 : 2;  // COM 정량 colspan

// 1단 총 열 수
const h1 = 1 + (1 + ec) + comN * (1 + cc);

// 바디 ri=0 td 수 (COM 시약명 rowspan=N 포함)
const b0 = 1 + 1 + ec + comN * (1 + cc);

// 바디 ri>0 td 수 (COM 시약명 rowspan으로 없음)
const bN = 1 + 1 + ec + comN * cc;

// 검증: h1 === b0 → 항상 성립
```

---

## 바디 셀 구조 (행별)

### ri === 0 (첫 번째 행)

```
실험번호(id-cell) | E시약명+돋보기 | [eq or 1.00] | [mmol or input] | weight | measure |
  COM시약명(rowspan=N) | [COM eq or 1.00] | [COM mmol or input] | COM weight | COM measure |
  ... × comN
```

### ri > 0 (나머지 행)

```
실험번호(id-cell) | E시약명+돋보기 | [eq or 1.00] | [mmol or input] | weight | measure |
  [COM eq or 1.00] | [COM mmol or input] | COM weight | COM measure |
  ... × comN
  (COM 시약명 셀 없음 — rowspan으로 병합됨)
```

---

## 실험번호 셀 주의사항

- `position: relative` 필수
- 삭제 버튼은 `position: absolute; right: 2px; top: 50%` — hover 시에만 표시
- 테이블 셀 크기 변동 없음 (absolute라 레이아웃에 영향 X)

---

## 참고값 토글 동작

| 상태 | 표시 열 |
|------|--------|
| ON | eq + mmol + weight + measure (4열) |
| OFF | weight + measure (2열) |

- 기준물질의 eq 칸: `1.00` 고정 표시 (입력 불가, 항상)
- 기준물질의 mmol 칸: refOn=ON 시 직접 입력 가능 (주황 강조 테두리)
- 기준물질의 weight 칸: mmol × MW 자동 (읽기 전용)
