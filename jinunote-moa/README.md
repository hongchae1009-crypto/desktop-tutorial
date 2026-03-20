# Jinunote 모아 실험 — Claude Code 인계 패키지

## 파일 목록

| 파일 | 설명 |
|------|------|
| `moa_experiment_v6.html` | 완성된 프로토타입 HTML (단일 파일, 브라우저에서 바로 실행 가능) |
| `CONTEXT.md` | 전체 설계 맥락, 데이터 모델, 계산 로직, 미결 사항 |
| `TABLE_HEADER.md` | Starting 정량 테이블 헤더 구조 (이미지 확정본, 코드 미반영) |
| `types.ts` | TypeScript 타입 정의 |
| `utils.ts` | 핵심 계산 로직 (오차율·mmol·weight·colspan 검증) |

---

## 빠른 시작

### 1. HTML 프로토타입 확인

```bash
open moa_experiment_v6.html
```

### 2. Claude Code에 첫 메시지

```
이 패키지를 참고해서 React + TypeScript로 구현해줘.

파일 설명:
- moa_experiment_v6.html: 완성 프로토타입 (UI 레퍼런스)
- CONTEXT.md: 설계 문서 (데이터 모델, 계산 로직)
- TABLE_HEADER.md: 테이블 헤더 구조 (HTML에 미반영, 이걸 기준으로 구현)
- types.ts: 타입 정의
- utils.ts: 핵심 로직

types/moa.ts 만들고 → QuantTable 컴포넌트부터 시작해줘.
TABLE_HEADER.md의 colspan 검증 공식 반드시 지켜야 해.
```

---

## 핵심 주의사항

### QuantTable colspan 규칙

```
refOn=ON  → ec = cc = 4  (eq + mmol + weight + measure)
refOn=OFF → ec = cc = 2  (weight + measure)

h1 = 1 + (1+ec) + N×(1+cc)   ← 1단
b0 = 1 + 1 + ec + N×(1+cc)   ← 바디 ri=0
h1 === b0  항상 성립 (깨지면 테이블 깨짐)
```

### 기준물질 시스템

- 라디오 버튼 1개만 선택 (name="base-radio")
- 기준: mmol 직접 입력, eq=1 고정
- 비기준: eq 입력 → mmol = baseMmol × eq 자동

### 실험결과 mmol

```
mmol = 수득량(mg) / MW   (mg=0이면 null)
```

---

## 현재 상태 (v6 기준)

✅ 완성된 기능
- 목록 뷰 ↔ 상세 뷰 전환
- Starting 정량 테이블 (기준물질 시스템, 자동계산, 오차 뱃지)
- 참고값 토글 (ON/OFF)
- 실험 행 / 공통시약 열 추가·삭제
- 실험기록 탭 (공통 + HCE별)
- 실험결과 테이블 (화합물 검색·등록, mmol 자동계산)
- Yield 차트
- 첨부파일 + 미리보기 모달
- 댓글 (멘션, 답글, 삭제)
- 메모 (접기/펼치기)
- Undo (최대 20단계)

⚠️ HTML 미반영 (TABLE_HEADER.md 기준으로 구현 필요)
- Starting 정량 테이블 헤더 최종 구조

🔲 미구현
- 시약장 API 연동
- 시약 등록 API 연동
- Scheme 편집
- 프린트 레이아웃
