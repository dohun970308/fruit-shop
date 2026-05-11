import 'server-only';

/**
 * 메모리 기반 슬라이딩 윈도우 rate limiter.
 * - 단일 서버 인스턴스 내에서만 동작하므로 분산 환경에선 정확도가 떨어진다.
 * - 운영 단계에선 Upstash/Redis 등으로 교체 권장.
 */
const buckets = new Map<string, number[]>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    const oldest = hits[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, remaining: limit - hits.length, retryAfterSec: 0 };
}

export function getClientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
