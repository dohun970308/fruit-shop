# 과일 판매 웹사이트 프로젝트

## 1. 프로젝트 개요

과일을 판매하는 웹사이트. **온라인 결제 없음** — 구매자는 상품을 장바구니에 담아 주문 정보(이름, 연락처, 주소)만 제출하고, 관리자가 관리자 페이지에서 주문을 확인해 오프라인으로 처리(전화 연결, 입금 안내, 배송)한다.

- 회원가입/로그인 없음 (관리자만 로그인)
- 결제 모듈 없음
- 주문 조회는 이름 + 연락처로

## 2. 기술 스택

이전 프로젝트(상품권 매입 사이트, 자동차 구독 사이트)와 동일 스택 사용 — 익숙하고 안정적.

- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS
- **UI**: shadcn/ui (new-york 스타일)
- **DB / 인증 / 스토리지**: Supabase (PostgreSQL + Auth + Storage)
- **유효성 검증**: Zod
- **폼**: react-hook-form + @hookform/resolvers
- **아이콘**: lucide-react
- **폰트**: Pretendard
- **패키지 매니저**: pnpm
- **배포**: Vercel

> 색상: **보라색/violet 계열 사용 금지**. 과일 사이트 톤에 어울리는 따뜻한 색(예: orange-50 ~ orange-600 또는 green-50 ~ green-700 또는 둘 조합)으로.

## 3. 페이지 구조

### 공개 페이지
- `/` — 메인. 히어로 + 상품 6개 카드 그리드
- `/products/[id]` — 상품 상세 (이미지, 설명, 수량 선택, 장바구니 담기)
- `/cart` — 장바구니 (담은 상품 수정/삭제, 합계, 주문하기 버튼)
- `/checkout` — 주문 정보 입력 폼 (이름, 연락처, 주소) → 제출 → 완료 페이지
- `/checkout/complete?orderNo=XXX` — 주문 완료 (주문번호 표시 + 안내문)
- `/orders/lookup` — 주문 조회 (이름 + 연락처 입력 → 본인 주문 목록)

### 관리자 페이지 (Supabase Auth 보호)
- `/admin/login` — 로그인
- `/admin` — 대시보드 (오늘 주문 / 총 주문 / 처리 대기 카운트)
- `/admin/orders` — 주문 목록 (필터: 상태/날짜, 상태 변경, 삭제)
- `/admin/orders/[id]` — 주문 상세 (구매자 정보, 주문 상품 목록, 상태 변경, 삭제)
- `/admin/products` — 상품 관리 (목록 + 추가/수정/삭제 + 이미지 업로드)
- `/admin/products/[id]` — 상품 수정 폼

## 4. 데이터베이스 스키마 (Supabase / PostgreSQL)

### `products` 테이블 — 상품
```sql
create table products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                  -- "랜덤 과일 1박스" 등
  description text,                            -- 상품 설명
  price       integer not null,                -- 원 단위, 정수
  image_url   text,                            -- Supabase Storage URL
  sort_order  integer not null default 0,      -- 진열 순서
  is_active   boolean not null default true,   -- 노출 여부
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index products_sort_idx on products (sort_order, created_at);
```

### `orders` 테이블 — 주문
```sql
create table orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        text not null unique,        -- "ORD-20260511-A3F2" 형식
  customer_name   text not null,
  customer_phone  text not null,               -- "01012345678" 숫자만 저장 권장
  shipping_address text not null,
  total_amount    integer not null,            -- 주문 합계 (원)
  status          text not null default 'RECEIVED'
                  check (status in ('RECEIVED', 'DELIVERED')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index orders_lookup_idx on orders (customer_name, customer_phone);
create index orders_created_idx on orders (created_at desc);
create index orders_status_idx on orders (status);
```

### `order_items` 테이블 — 주문 상품 (한 주문에 여러 상품)
```sql
create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  product_name text not null,                  -- 주문 시점 상품명 스냅샷
  unit_price  integer not null,                -- 주문 시점 가격 스냅샷
  quantity    integer not null check (quantity > 0),
  subtotal    integer not null,                -- unit_price * quantity
  created_at  timestamptz not null default now()
);

create index order_items_order_idx on order_items (order_id);
```

> 스냅샷 컬럼(`product_name`, `unit_price`)을 두는 이유: 관리자가 상품 가격을 나중에 바꿔도 과거 주문은 주문 시점 가격이 그대로 보이게.

### RLS 정책
- `products`: 익명/인증 사용자 SELECT 허용 (`is_active = true`만). 관리자는 service_role로 모든 작업.
- `orders`, `order_items`: 익명 SELECT 차단. 모든 접근은 서버 라우트에서 service_role로.
- 주문 조회 API는 service_role 클라이언트로 처리(이름+연락처 매칭만 반환).

### Storage 버킷
- `product-images` 버킷 생성 (public 읽기 허용, 쓰기는 service_role만)

## 5. 초기 상품 시드 데이터

```sql
insert into products (name, price, sort_order, description) values
  ('랜덤 과일 봉지',       10000,   10, '제철 과일을 봉지에 담아드립니다.'),
  ('랜덤 과일 1kg',        30000,   20, '제철 과일 1kg 모음 구성.'),
  ('랜덤 과일 1박스',      50000,   30, '제철 과일을 가득 담은 1박스.'),
  ('선물 세트',           100000,   40, '깔끔한 선물용 과일 세트.'),
  ('고급 선물 세트',      500000,   50, '엄선한 고급 과일 선물 세트.'),
  ('프리미엄 선물 세트', 1000000,   60, '최상급 프리미엄 과일 선물 세트.');
```

> 가격/이름은 관리자 페이지에서 언제든 수정 가능. 이미지는 관리자가 업로드.

## 6. 주요 기능 명세

### 6.1 상품 카드 (메인 페이지)
- 6개 상품 카드 그리드 (모바일 1열, 태블릿 2열, 데스크탑 3열)
- 카드 내용: 이미지 / 이름 / 가격(`₩50,000` 형식 천 단위 콤마) / "상세보기" 버튼
- 이미지 없을 때 placeholder

### 6.2 상품 상세 (`/products/[id]`)
- 큰 이미지 + 이름 + 가격 + 설명
- 수량 선택 (-/+ 버튼, 최소 1, 최대 99)
- "장바구니 담기" 버튼 → 장바구니에 추가 + 토스트 "장바구니에 담겼습니다"
- "바로 주문하기" 버튼 → 장바구니에 추가 후 `/cart`로 이동

### 6.3 장바구니 (`/cart`)
- **localStorage 기반** (회원 없으니 서버 저장 불필요)
- 담긴 상품 목록 (이미지, 이름, 단가, 수량 조절, 소계, 삭제 버튼)
- 합계 표시
- "주문하기" 버튼 → `/checkout`
- 빈 장바구니일 때 "장바구니가 비어있습니다" + "쇼핑 계속하기" 버튼

### 6.4 주문 폼 (`/checkout`)
- 상단: 주문 상품 요약 (수정 불가, 합계 표시)
- 입력 필드:
  - 이름 (2~20자)
  - 연락처 (숫자만, 10~11자리, 자동 하이픈 표시 e.g. `010-1234-5678`)
  - 배송 주소 (10자 이상)
- "주문하기" 버튼 → `POST /api/orders`
  - 서버에서 zod 검증
  - `order_no` 생성: `ORD-YYYYMMDD-XXXX` (XXXX는 랜덤 4자리 영숫자 대문자)
  - `orders` 1건 + `order_items` 여러 건 트랜잭션으로 insert
  - 성공 시 `{ orderNo }` 반환
- 성공 시 장바구니 비우고 `/checkout/complete?orderNo=XXX`로 리다이렉트

### 6.5 주문 완료 (`/checkout/complete`)
- 큰 체크 아이콘 + "주문이 접수되었습니다"
- 주문번호 (복사 버튼)
- 안내문 (예: "곧 입력하신 연락처로 안내드릴 예정입니다")
- "주문 조회하기" 버튼 → `/orders/lookup`
- "쇼핑 계속하기" 버튼 → `/`

### 6.6 주문 조회 (`/orders/lookup`)
- 폼: 이름 + 연락처
- `POST /api/orders/lookup` → 이름+연락처 매칭 주문 목록 반환
- 결과 테이블: 주문번호 / 주문일시 / 상품 요약(예: "랜덤 과일 1박스 외 2건") / 합계 / 상태
- Rate limit: IP당 분당 10회 (간단히 메모리 기반 또는 미적용)

### 6.7 관리자 — 로그인
- Supabase Auth (이메일+비밀번호)
- 첫 관리자 계정은 Supabase 대시보드에서 직접 생성 후 SQL로 admin role 부여:
  ```sql
  update auth.users 
  set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb 
  where email = 'admin@example.com';
  ```
- middleware.ts에서 `/admin/*` (login 제외) 보호. 미인증 시 `/admin/login` 리다이렉트.

### 6.8 관리자 — 대시보드 (`/admin`)
- 카드 4개: 오늘 주문 / 총 주문 / 처리 대기(RECEIVED) / 배송 완료(DELIVERED)
- 최근 주문 5건 미리보기

### 6.9 관리자 — 주문 목록 (`/admin/orders`)
- 필터: 상태(전체/접수/완료), 기간(오늘/이번주/이번달/전체)
- 검색: 이름 / 연락처 / 주문번호
- 테이블 컬럼: **주문일시 / 구매자(이름+연락처) / 주문 상품(요약) / 배송 주소 / 합계 / 상태 / 액션**
- 액션: "상세" / "상태 변경(드롭다운)" / "삭제(확인 다이얼로그)"
- 페이지네이션 (20건)

### 6.10 관리자 — 주문 상세 (`/admin/orders/[id]`)
- 주문번호, 주문일시
- 구매자: 이름 / 연락처(클릭 시 전화걸기) / 배송 주소
- 주문 상품 목록 (상품명 / 단가 / 수량 / 소계)
- 합계
- 상태 변경 버튼 ("접수 → 배송 완료" 토글 또는 명시 버튼)
- 삭제 버튼 (확인 다이얼로그 필수)

### 6.11 관리자 — 상품 관리 (`/admin/products`)
- 테이블: 이미지 썸네일 / 이름 / 가격 / 진열순서 / 노출여부 / 수정 / 삭제
- "상품 추가" 버튼 → `/admin/products/new`
- 인라인 진열순서 수정 가능 (또는 수정 페이지에서)

### 6.12 관리자 — 상품 추가/수정 (`/admin/products/new`, `/admin/products/[id]`)
- 입력: 이름 / 가격(원) / 설명(textarea) / 진열순서(정수) / 노출여부(스위치)
- 이미지 업로드:
  - `<input type="file" accept="image/*">`
  - Supabase Storage `product-images` 버킷에 업로드
  - 업로드 후 public URL을 `image_url`에 저장
  - 미리보기 표시
  - 이미지 교체 시 기존 파일 삭제(선택)
- 저장 / 취소 버튼

## 7. 환경 변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

## 8. 폴더 구조

```
/app
  /(public)
    layout.tsx
    page.tsx                       # 메인
    /products/[id]/page.tsx
    /cart/page.tsx
    /checkout/page.tsx
    /checkout/complete/page.tsx
    /orders/lookup/page.tsx
  /admin
    layout.tsx
    /login/page.tsx
    page.tsx                       # 대시보드
    /orders/page.tsx
    /orders/[id]/page.tsx
    /products/page.tsx
    /products/new/page.tsx
    /products/[id]/page.tsx
  /api
    /orders/route.ts               # POST 주문 생성
    /orders/lookup/route.ts        # POST 주문 조회
    /admin/orders/[id]/route.ts    # PATCH 상태 변경, DELETE 삭제
    /admin/products/route.ts       # POST 생성
    /admin/products/[id]/route.ts  # PATCH, DELETE
    /admin/upload/route.ts         # 이미지 업로드
/components
  /ui                              # shadcn
  /public
    ProductCard.tsx
    CartItem.tsx
    QuantityInput.tsx
  /admin
    OrderRow.tsx
    ProductForm.tsx
    ImageUpload.tsx
/lib
  /supabase
    client.ts                      # 브라우저용 (createBrowserClient)
    server.ts                      # 서버 컴포넌트용 (createServerClient + cookies)
    service.ts                     # service_role 키 (서버 전용)
  cart.ts                          # localStorage 헬퍼
  format.ts                        # 가격/전화번호 포맷
  validators.ts                    # zod 스키마
  orderNo.ts                       # 주문번호 생성
/supabase
  /migrations
    0001_init.sql
  seed.sql
middleware.ts
```

## 9. 디자인 가이드

- **컬러**: 따뜻한 톤. 메인 액센트 `orange-500` ~ `orange-600` 또는 `green-600` ~ `green-700` 중 1. 보라색 계열 **사용 금지**.
- 배경: `bg-stone-50` 또는 `bg-orange-50/30` 같은 부드러운 베이스
- 카드: 둥근 모서리 (`rounded-2xl`), 부드러운 그림자
- 폰트: Pretendard, 본문 16px 기준
- 모바일 우선 반응형
- shadcn 컴포넌트 풀활용 (Button, Input, Card, Table, Dialog, Select, Toast, Form, Badge, Switch)

## 10. 운영/보안 메모

- 관리자 service_role 키 클라이언트 노출 절대 금지
- 주문 조회 API에 rate limit 권장 (메모리 기반 간단 구현 OK)
- 주문 삭제는 hard delete (혹은 추후 soft delete 전환 가능)
- 개인정보(이름·연락처·주소) 보관 기간 정책은 운영 단계에서 결정
