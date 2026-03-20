/**
 * 날짜를 한국어 상대 시간 문자열로 변환한다.
 * - 2분 이내  → "N분 전"
 * - 당일       → "N시간 전"
 * - 전날       → "어제"
 * - 그 이전   → "N일 전"
 */
export function timeAgo(date: Date, now = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 2) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;

  // 당일 여부: 연·월·일이 같으면 당일
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) return `${diffHour}시간 전`;

  if (diffDay === 1) return '어제';
  if (diffDay < 7) return `${diffDay}일 전`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}주 전`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}달 전`;

  return `${Math.floor(diffDay / 365)}년 전`;
}
