export function formatPrice(won: number): string {
  return `₩${won.toLocaleString('ko-KR')}`;
}

/**
 * 전화번호를 보기 좋게 포맷팅. 입력 자릿수에 따라 유연하게 처리.
 * - 10자리: 02-1234-5678 또는 010-123-4567
 * - 11자리: 010-1234-5678
 * - 그 외:  숫자만 그대로 반환
 */
export function formatPhone(raw: string): string {
  const digits = normalizePhone(raw);

  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}
