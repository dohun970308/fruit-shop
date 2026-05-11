/**
 * Asia/Seoul 기준 날짜 경계를 UTC ISO 문자열로 반환하는 헬퍼.
 * Supabase의 timestamptz 비교에 그대로 쓸 수 있도록 항상 ISO로 돌려준다.
 */

function kstYmd(now = new Date()): { y: string; m: string; d: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(now)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  );
  return { y: parts.year, m: parts.month, d: parts.day };
}

function kstMidnightISO(y: string, m: string, d: string): string {
  return new Date(`${y}-${m}-${d}T00:00:00+09:00`).toISOString();
}

export function startOfTodayKst(now = new Date()): string {
  const { y, m, d } = kstYmd(now);
  return kstMidnightISO(y, m, d);
}

export function startOfThisWeekKst(now = new Date()): string {
  // 주의 시작 = 월요일 KST 00:00
  const today = startOfTodayKst(now);
  const todayDate = new Date(today);
  const dow = new Date(
    todayDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
  ).getDay(); // 0(Sun)~6(Sat)
  const diff = dow === 0 ? 6 : dow - 1; // Monday=0 base
  const monday = new Date(todayDate.getTime() - diff * 24 * 60 * 60 * 1000);
  return monday.toISOString();
}

export function startOfThisMonthKst(now = new Date()): string {
  const { y, m } = kstYmd(now);
  return kstMidnightISO(y, m, '01');
}

export type PeriodKey = 'today' | 'week' | 'month' | 'all';

export function periodSinceISO(period: PeriodKey, now = new Date()): string | null {
  switch (period) {
    case 'today':
      return startOfTodayKst(now);
    case 'week':
      return startOfThisWeekKst(now);
    case 'month':
      return startOfThisMonthKst(now);
    case 'all':
    default:
      return null;
  }
}
