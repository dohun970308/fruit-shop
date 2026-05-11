const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function randomSuffix(len = 4): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

/**
 * "ORD-YYYYMMDD-XXXX" 형식의 주문번호를 생성한다.
 * 동일 초에 여러 요청이 와도 4자리 랜덤 영숫자로 충돌을 낮추고,
 * 최종 unique 보장은 DB의 `orders.order_no` unique 제약에 위임한다.
 */
export function generateOrderNo(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `ORD-${y}${m}${d}-${randomSuffix(4)}`;
}
