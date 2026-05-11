# 🍊 과일 가게 (fruit-shop)

오프라인 처리(전화/입금/배송) 기반의 과일 판매 사이트. **온라인 결제 없음** — 구매자는 상품을 장바구니에 담아 주문 정보(이름·연락처·주소)만 제출하고, 관리자가 관리자 페이지에서 주문을 확인해 처리합니다.

- 회원가입/로그인 없음 (관리자만 로그인)
- 결제 모듈 없음
- 주문 조회는 이름 + 연락처로

## 기술 스택

- **Next.js 14** (App Router) · **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (new-york)
- **Supabase** (PostgreSQL + Auth + Storage)
- **Zod** · **react-hook-form** · **lucide-react** · **sonner**
- 패키지 매니저: **pnpm**
- 배포: **Vercel**

## 환경 변수

Supabase Dashboard → Project Settings → API에서 값을 받아 `.env.local`에 채웁니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회합니다. **서버 라우트/서버 컴포넌트에서만** 사용하며 절대 클라이언트 번들에 노출하지 마세요. `lib/supabase/service.ts`는 `server-only`로 가드되어 있습니다.

## 로컬 실행

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

품질 점검:

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
pnpm build        # 프로덕션 빌드
```

## Supabase 셋업

### 1. 마이그레이션 실행

`supabase/migrations/0001_init.sql`을 Supabase Dashboard → **SQL Editor**에서 실행합니다 (또는 Supabase MCP / Supabase CLI 사용).

생성되는 것:

- 테이블: `products`, `orders`, `order_items` + 인덱스 + `updated_at` 트리거
- RLS:
  - `products`: anon/authenticated는 `is_active = true`만 SELECT
  - `orders`, `order_items`: anon/authenticated 모두 차단 (서버 라우트에서 `service_role`로만 접근)
- GRANT: `products`만 anon/authenticated에 SELECT 허용

### 2. 시드 데이터

`supabase/seed.sql`을 실행하면 6개의 기본 상품이 들어갑니다.

### 3. Storage 버킷 생성

Supabase Dashboard → Storage → New bucket:

- 버킷 이름: `product-images`
- **Public bucket** 체크 (읽기 공개)
- 쓰기는 `service_role`만 (관리자 API가 처리하므로 별도 RLS policy 불필요)

### 4. 첫 관리자 계정 생성

1. Supabase Dashboard → **Authentication** → Users → "Add user" → 이메일/비밀번호 등록
2. SQL Editor에서 admin role 부여:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
where email = '<관리자 이메일>';
```

검증:

```sql
select email, raw_app_meta_data
from auth.users
where email = '<관리자 이메일>';
```

> `app_metadata`는 JWT 발급 시점에 박힙니다. 이미 로그인된 세션이 있다면 **로그아웃 후 재로그인** 해야 새 토큰에 role이 들어옵니다.

## 페이지 구조

### 공개 페이지

| 경로 | 설명 |
|---|---|
| `/` | 메인 (히어로 + 활성 상품 카드 그리드) |
| `/products/[id]` | 상품 상세 (이미지·설명·수량·장바구니/바로 주문) |
| `/cart` | 장바구니 (localStorage 기반) |
| `/checkout` | 주문 정보 입력 폼 |
| `/checkout/complete?orderNo=...` | 주문 완료 (주문번호 복사) |
| `/orders/lookup` | 주문 조회 (이름 + 연락처) |

### 관리자 페이지 (`/admin/*`, 미들웨어로 보호)

| 경로 | 설명 |
|---|---|
| `/admin/login` | 로그인 |
| `/admin` | 대시보드 (오늘/총/처리 대기/배송 완료 + 최근 5건) |
| `/admin/orders` | 주문 목록 (상태/기간 필터, 이름·연락처·주문번호 검색, 페이지네이션 20건) |
| `/admin/orders/[id]` | 주문 상세 (상태 토글, 삭제) |
| `/admin/products` | 상품 관리 (썸네일·이름·가격·순서·노출) |
| `/admin/products/new` | 상품 추가 |
| `/admin/products/[id]` | 상품 수정 / 삭제 |

### API 라우트

| 경로 | 메서드 | 설명 |
|---|---|---|
| `/api/orders` | POST | 주문 생성 (가격 서버 확정, 스냅샷 저장) |
| `/api/orders/lookup` | POST | 주문 조회 (이름+연락처, IP당 분당 10회 rate limit) |
| `/api/admin/orders/[id]` | PATCH / DELETE | 상태 변경 / 삭제 |
| `/api/admin/products` | POST | 상품 생성 |
| `/api/admin/products/[id]` | PATCH / DELETE | 상품 수정 / 삭제 (Storage 이미지 자동 정리) |
| `/api/admin/upload` | POST | 이미지 업로드 (5MB / image MIME 검증) |

모든 `/api/admin/*`는 `lib/auth/requireAdmin.ts`로 admin role 검증.

## Vercel 배포

1. GitHub에 푸시 후 [vercel.com/new](https://vercel.com/new)에서 import
2. Environment Variables에 `.env.local` 값 그대로 등록:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Build Command: `pnpm build` (자동 감지됨)
4. Deploy
5. Supabase Dashboard → Authentication → URL Configuration의 **Site URL / Additional Redirect URLs**에 배포 도메인 추가

## 디자인 가이드

- 컬러: 따뜻한 톤. 메인 액센트 `orange-500` ~ `orange-600`, 보조 `green-600` ~ `green-700`. **보라색 계열 금지**.
- 카드: `rounded-2xl`, 부드러운 그림자
- 폰트: Pretendard Variable (CDN)
- 모바일 우선 반응형

## 보안 / 운영 메모

- `SUPABASE_SERVICE_ROLE_KEY` 클라이언트 노출 절대 금지 (자동 감지: `lib/supabase/service.ts`의 `'server-only'`)
- 모든 `/api/admin/*` 라우트는 `requireAdminApi`로 401 가드
- `orders` 테이블 RLS로 anon 접근 차단
- 주문 조회 API에 메모리 기반 rate limit (IP당 분당 10회)
- 상품 가격은 클라이언트 값 신뢰 안 함 — 주문 생성 시 서버에서 `is_active=true` 상품의 현재 가격으로 다시 계산
- `order_items`는 주문 시점의 `product_name`, `unit_price` 스냅샷을 보관 — 상품 수정/삭제 후에도 과거 주문이 정확히 보존됨

## 폴더 구조

```
/app
  /(public)            # 공개 페이지 그룹 (Header/Footer 레이아웃)
  /admin               # 관리자 (login + (panel) 그룹)
  /api                 # Route handlers
/components
  /ui                  # shadcn 컴포넌트
  /public              # 공개 페이지 컴포넌트
  /admin               # 관리자 컴포넌트
/lib
  /supabase            # client / server / service (3종)
  /auth                # requireAdmin
  cart.ts, format.ts, validators.ts, orderNo.ts, rateLimit.ts, dateRange.ts, storage.ts, types.ts
/supabase
  /migrations/0001_init.sql
  seed.sql
middleware.ts          # /admin/* 보호
```
