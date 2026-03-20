/**
 * 페이지네이션 버튼 목록을 생성한다.
 * - 항상 첫 페이지·마지막 페이지 표시
 * - 현재 페이지 ±2 범위 표시
 * - 그 사이 간격이 2 이상이면 "···" 삽입
 *
 * @returns (number | '···')[] — number는 페이지 번호, '···'은 생략 표시
 */
export function buildPageItems(
  currentPage: number,
  totalPages: number,
): (number | '···')[] {
  if (totalPages <= 1) return [1];

  const delta = 2;
  const range: number[] = [];

  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }

  const items: (number | '···')[] = [1];

  if (range[0] > 2) items.push('···');
  items.push(...range);
  if (range[range.length - 1] < totalPages - 1) items.push('···');
  if (totalPages > 1) items.push(totalPages);

  return items;
}

/** 전체 데이터에서 현재 페이지 슬라이스를 반환 */
export function paginate<T>(data: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage;
  return data.slice(start, start + perPage);
}

/** 총 페이지 수 계산 */
export function totalPages(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}
