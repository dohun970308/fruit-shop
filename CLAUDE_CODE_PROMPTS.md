# Claude Code 단계별 작업 프롬프트

> 사용법: 프로젝트 폴더에 `PROJECT_CONTEXT.md`를 두고 Warp에서 `claude` 실행.
> 각 STEP을 순서대로 하나씩 붙여넣기. 한 STEP이 끝나면 결과 확인 후 다음으로.
> 막히면 "에러 메시지 [원문] 발생함. 원인 분석하고 고쳐줘" 라고 하면 됨.
> Supabase MCP, Pencil MCP 적극 활용해도 좋다고 명시.

---

## STEP 0 — 프로젝트 초기화

```
PROJECT_CONTEXT.md를 먼저 끝까지 읽고 전체 구조를 파악해줘.

그 다음 Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase 기반으로
프로젝트를 초기화해줘.

요구사항:
- pnpm 사용
- ESLint, Prettier 설정
- shadcn/ui 초기화 (스타일: new-york, 베이스 컬러: stone)
- Pretendard 웹폰트 적용 (next/font 또는 CDN 중 안정적인 방법으로)
- 패키지 설치:
  - @supabase/ssr, @supabase/supabase-js
  - zod, react-hook-form, @hookform/resolvers
  - lucide-react
  - sonner (toast)

lib/supabase 아래 클라이언트 3종 파일 생성:
- client.ts: 브라우저용 (createBrowserClient)
- server.ts: 서버 컴포넌트/Route Handler용 (createServerClient + cookies())
- service.ts: service_role 키 (서버 전용, RLS 우회)

middleware.ts 생성:
- @supabase/ssr 기반 세션 갱신
- /admin/* 경로 (단, /admin/login은 제외) 인증 가드
- 미인증 시 /admin/login으로 리다이렉트
- admin role 검증 (raw_app_meta_data.role === 'admin')

.env.example 파일 생성 (실제 값은 빈 템플릿).
.env.local은 빈 템플릿으로만 생성하고 실제 값은 STEP 1에서 채울 예정.

PROJECT_CONTEXT.md 8번에 명시된 폴더 구조에 맞게 빈 폴더와 placeholder 파일 만들어줘.

완료 후 폴더 트리 보여줘.
```

---

## STEP 1 — Supabase 프로젝트 연동

```
Supabase MCP가 연결되어 있다면 그걸로, 아니라면 안내 멘트로 다음 작업 진행:

1. 새 Supabase 프로젝트 생성 (또는 기존 프로젝트 사용 — 사용자에게 묻기)
2. .env.local에 다음 3개 값 채우기:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

3. supabase/migrations/0001_init.sql 파일 생성.
   PROJECT_CONTEXT.md 4번 섹션의 SQL 그대로 작성:
   - products, orders, order_items 테이블
   - 인덱스 전부
   - RLS enable
   - RLS 정책:
     * products: anon, authenticated SELECT는 is_active = true만 허용
     * orders, order_items: anon SELECT/INSERT 모두 차단 (서버 라우트에서 service_role로만 접근)
   - GRANT 구문:
     * grant select on products to anon, authenticated;
     * orders, order_items는 GRANT 안 함

4. Supabase Storage 버킷 생성:
   - 버킷명: product-images
   - public 읽기 허용 (public = true)
   - 쓰기는 service_role로만

5. supabase/seed.sql에 PROJECT_CONTEXT.md 5번의 INSERT 구문 작성.

Supabase MCP로 마이그레이션과 시드 모두 실행해줘.
실행 후 테이블 목록과 products 6건이 잘 들어갔는지 SELECT로 확인해서 보여줘.
```

---

## STEP 2 — 공통 라이브러리 + 레이아웃

```
PROJECT_CONTEXT.md 9번 디자인 가이드 준수. 보라색 계열 절대 사용 금지.
메인 액센트 컬러는 orange-500 또는 green-600 중 사이트 톤에 어울리는 걸로 통일.

작업:

1. lib/format.ts
   - formatPrice(won: number): string  → "₩50,000"
   - formatPhone(raw: string): string  → "010-1234-5678" (입력 자릿수 따라 유연하게)
   - normalizePhone(raw: string): string  → 숫자만 추출 "01012345678"

2. lib/validators.ts (zod 스키마)
   - orderItemSchema: { productId, quantity }
   - createOrderSchema: { customerName, customerPhone, shippingAddress, items: [...] }
     * customerName: min 2 max 20
     * customerPhone: 정규식 ^01[0-9]{8,9}$ (정규화 후)
     * shippingAddress: min 10
     * items: 최소 1개, 각 quantity 1~99
   - lookupOrderSchema: { customerName, customerPhone }
   - productFormSchema: { name, description, price (min 0), sortOrder, isActive }

3. lib/cart.ts (localStorage 기반)
   - 타입: CartItem { productId, name, price, imageUrl, quantity }
   - getCart(): CartItem[]
   - addToCart(item, quantity)
   - updateQuantity(productId, quantity)
   - removeFromCart(productId)
   - clearCart()
   - getCartTotal(): number
   - SSR 안전 처리 (typeof window 체크)
   - 변경 시 'cart-updated' 커스텀 이벤트 dispatch (Header 카운트 동기화용)

4. lib/orderNo.ts
   - generateOrderNo(): "ORD-YYYYMMDD-XXXX" (XXXX는 대문자 영숫자 랜덤 4자리)

5. app/(public)/layout.tsx
   - 상단 헤더: 로고 / 메뉴(전체상품, 주문조회, 장바구니[카운트 뱃지])
   - 모바일 햄버거
   - 푸터: 사업자정보 placeholder, 카피라이트
   - 카트 카운트는 use client + 'cart-updated' 이벤트 구독

6. app/admin/layout.tsx
   - 사이드바: 대시보드 / 주문 / 상품 / 로그아웃
   - /admin/login에선 사이드바 없이 단독 레이아웃
   - 상단에 관리자 이메일 표시

7. components/ui에 shadcn 컴포넌트 추가:
   button, input, label, card, table, dialog, select, sonner(toast), form, badge, switch, textarea, alert-dialog

완료 후 pnpm dev 실행 가능 상태인지 확인하고, 메인 페이지 빈 골격이라도 떠야 함.
```

---

## STEP 3 — 공개 페이지 (상품 목록 / 상세 / 장바구니)

```
1. app/(public)/page.tsx (서버 컴포넌트)
   - lib/supabase/server.ts로 products where is_active=true order by sort_order, created_at
   - 히어로 섹션 (큰 카피 + CTA "지금 주문하기")
   - 상품 카드 그리드 (모바일 1열 / sm 2열 / lg 3열)
   - 각 카드: components/public/ProductCard.tsx

2. components/public/ProductCard.tsx
   - 이미지 (aspect-square, 없으면 placeholder)
   - 상품명, 가격(formatPrice)
   - "상세보기" 버튼 → /products/[id]
   - hover 시 살짝 떠오르는 효과

3. app/(public)/products/[id]/page.tsx
   - 서버 컴포넌트: 해당 상품 fetch (is_active=true 한정), 없으면 notFound()
   - 좌측 큰 이미지 / 우측 정보
   - 정보: 이름, 가격, 설명(줄바꿈 유지), QuantityInput, "장바구니 담기" + "바로 주문하기" 버튼
   - 두 버튼은 use client 컴포넌트로 분리 (AddToCartButtons)
   - "바로 주문하기" → addToCart 후 router.push('/cart')
   - 토스트로 "장바구니에 담겼습니다" 표시

4. components/public/QuantityInput.tsx (use client)
   - -/+ 버튼 + 숫자 입력
   - 최소 1, 최대 99
   - 부모로 onChange 콜백

5. app/(public)/cart/page.tsx (use client)
   - useEffect로 getCart() 로드
   - 빈 카트 UI 분기
   - 카트 아이템 리스트 (CartItem 컴포넌트)
   - 합계 카드 (sticky 오른쪽 또는 하단)
   - "주문하기" 버튼 → /checkout
   - "쇼핑 계속하기" 버튼 → /

6. components/public/CartItem.tsx
   - 이미지, 이름, 단가, QuantityInput, 소계, 삭제 버튼

체크: 보라색 절대 사용 금지. 컬러는 orange 또는 green 톤으로.
```

---

## STEP 4 — 주문 폼 / 주문 완료 / 주문 조회

```
1. app/(public)/checkout/page.tsx (use client)
   - 마운트 시 getCart() 로드. 빈 카트면 /cart로 리다이렉트 + 토스트
   - 상단: 주문 상품 요약 (수정 불가) + 합계
   - 폼 (react-hook-form + zodResolver):
     * 이름 input
     * 연락처 input (입력 중 자동 하이픈 포맷)
     * 배송 주소 textarea
   - "주문하기" 버튼 → POST /api/orders
     * body: { customerName, customerPhone(정규화), shippingAddress, items: [{productId, quantity}, ...] }
   - 성공 시 clearCart() → router.push(`/checkout/complete?orderNo=${orderNo}`)
   - 실패 시 토스트로 에러 표시

2. app/api/orders/route.ts (POST)
   - service_role 클라이언트 사용
   - zod 검증 (createOrderSchema)
   - 제출된 productId 목록을 products에서 fetch (is_active=true 한정), 가격/이름 서버에서 확정
   - total_amount = sum(price * quantity)
   - order_no 생성
   - orders insert → order_items 일괄 insert
   - 모두 성공 시 200 + { orderNo }
   - 실패 시 적절한 status code + 에러 메시지

3. app/(public)/checkout/complete/page.tsx
   - URL 쿼리에서 orderNo 읽기
   - 큰 체크 아이콘, "주문이 접수되었습니다"
   - 주문번호 카드 (복사 버튼: navigator.clipboard.writeText + 토스트)
   - 안내문: "입력하신 연락처로 곧 안내드릴 예정입니다."
   - 버튼: "주문 조회하기" → /orders/lookup, "쇼핑 계속하기" → /

4. app/(public)/orders/lookup/page.tsx (use client)
   - 폼 (이름, 연락처)
   - 제출 → POST /api/orders/lookup
   - 결과 테이블:
     * 컬럼: 주문번호 / 주문일시 / 주문 상품(요약) / 합계 / 상태
     * 상품 요약: 첫 상품명 + 외 N건 (N>0일 때)
     * 상태 뱃지: 주문접수(주황) / 배송완료(녹색)
   - 결과 없으면 "주문 내역이 없습니다"

5. app/api/orders/lookup/route.ts (POST)
   - zod 검증
   - 전화번호 정규화 (하이픈 제거)
   - service_role로 orders + order_items 함께 조회 (customer_name AND customer_phone 일치)
   - 최신순 정렬
   - 응답: 주문 목록 + 각 주문의 첫 상품명 + 상품 개수
   - 간단한 IP 기반 rate limit (메모리 Map, 분당 10회) 또는 일단 skip

체크: 보라색 금지.
```

---

## STEP 5 — 관리자 인증 + 대시보드 + 주문 관리

```
1. app/admin/login/page.tsx (use client)
   - 이메일/비밀번호 폼
   - supabase.auth.signInWithPassword
   - 로그인 후 raw_app_meta_data.role === 'admin' 확인
   - admin 아니면 즉시 signOut 후 에러 토스트
   - 성공 시 router.push('/admin')

2. middleware.ts 보완:
   - /admin/* (login 제외) 접근 시 세션 확인 + role 확인
   - 미인증 또는 비관리자 → /admin/login 리다이렉트

3. app/admin/page.tsx (서버 컴포넌트, 대시보드)
   - service_role로 카운트:
     * 오늘 주문 수 (created_at >= today)
     * 총 주문 수
     * RECEIVED 수
     * DELIVERED 수
   - 카드 4개로 표시
   - 최근 주문 5건 미리보기 테이블

4. app/admin/orders/page.tsx
   - 필터: 상태 select (전체/RECEIVED/DELIVERED), 기간 select (오늘/이번주/이번달/전체)
   - 검색: 이름 OR 연락처 OR 주문번호 (단일 input, 서버에서 OR 매칭)
   - 테이블 컬럼: 주문일시 / 구매자(이름 + 연락처) / 주문 상품 요약 / 배송 주소 / 합계 / 상태 / 액션
   - 액션: "상세" 링크, 상태 변경 select(인라인), 삭제 버튼(AlertDialog)
   - 페이지네이션 20건

5. app/admin/orders/[id]/page.tsx
   - 주문번호, 주문일시 헤더
   - 구매자 카드: 이름 / 연락처(tel: 링크) / 배송 주소
   - 주문 상품 테이블 (상품명, 단가, 수량, 소계)
   - 합계
   - 상태 변경 버튼 (RECEIVED ↔ DELIVERED 토글 또는 명시 버튼)
   - 삭제 버튼 (AlertDialog 확인 후 실행)

6. app/api/admin/orders/[id]/route.ts
   - PATCH: 상태 변경. body { status }. 인증 확인 + service_role로 update.
   - DELETE: 주문 삭제 (cascade로 order_items 자동 삭제). 인증 확인.

7. 모든 관리자 API/페이지에서 인증 + role 확인 헬퍼 함수 만들어서 재사용:
   - lib/auth/requireAdmin.ts: 서버 컴포넌트/Route Handler에서 호출, 비관리자면 redirect 또는 401

체크: 보라색 금지. 관리자 페이지도 따뜻한 톤으로.
```

---

## STEP 6 — 관리자 상품 관리 + 이미지 업로드

```
1. app/admin/products/page.tsx
   - service_role로 모든 products 조회 (is_active 무관, sort_order 순)
   - 테이블: 이미지 썸네일 / 이름 / 가격 / 진열순서 / 노출 / 수정 / 삭제
   - "상품 추가" 버튼 → /admin/products/new

2. app/admin/products/new/page.tsx, [id]/page.tsx
   - 공용 components/admin/ProductForm.tsx 사용
   - new 모드: 빈 폼 / 저장 시 POST /api/admin/products
   - edit 모드: 기존 값 prefill / 저장 시 PATCH /api/admin/products/[id]
   - "삭제" 버튼 (edit 모드만, AlertDialog 후 DELETE)

3. components/admin/ProductForm.tsx
   - 필드: 이름 / 가격(원) / 설명(textarea) / 진열순서(number) / 노출여부(Switch)
   - 이미지 업로드 영역 (components/admin/ImageUpload.tsx)
   - react-hook-form + zodResolver(productFormSchema)

4. components/admin/ImageUpload.tsx (use client)
   - 현재 이미지 미리보기 (있으면)
   - 파일 선택 input (accept="image/*")
   - 파일 선택 시 → POST /api/admin/upload (multipart/form-data)
   - 응답 받은 public URL을 부모 폼의 image_url로 setValue
   - "이미지 제거" 버튼

5. app/api/admin/upload/route.ts (POST)
   - 인증 + admin role 확인
   - formData에서 file 추출
   - 파일 크기 검증 (예: 5MB 이하), MIME type 검증 (image/*)
   - Supabase Storage product-images 버킷에 업로드
     * 파일명: `${crypto.randomUUID()}.${ext}` (충돌 방지)
   - public URL 반환

6. app/api/admin/products/route.ts (POST)
   - 인증 + admin role 확인
   - zod 검증
   - service_role로 insert
   - 생성된 row 반환

7. app/api/admin/products/[id]/route.ts (PATCH, DELETE)
   - PATCH: update
   - DELETE: 해당 product의 image_url에서 파일 경로 추출 후 Storage에서도 삭제(선택), 그 후 row 삭제

체크: 보라색 금지.
```

---

## STEP 7 — 마무리 점검 + 배포 준비

```
다음 항목을 체크하고 문제 있으면 고쳐줘:

1. 동작 체크리스트:
   - [ ] 메인에서 상품 6개 카드가 잘 보인다
   - [ ] 상품 상세에서 수량 선택 후 장바구니 담기 OK
   - [ ] 장바구니에서 수량 수정/삭제 OK
   - [ ] 주문 폼에서 zod 검증 동작
   - [ ] 주문 제출 후 orders + order_items DB에 정상 insert
   - [ ] 주문번호 화면 표시 OK
   - [ ] 주문 조회에서 이름+연락처로 본인 주문만 보임
   - [ ] 관리자 로그인 후 대시보드 카운트 표시
   - [ ] 관리자 주문 목록 필터/검색/정렬 OK
   - [ ] 주문 상세에서 상태 변경/삭제 OK
   - [ ] 상품 추가/수정/삭제 OK, 이미지 업로드 OK

2. 보안 체크:
   - [ ] SUPABASE_SERVICE_ROLE_KEY가 클라이언트 번들에 노출 안 됨 (use client 파일에서 import 금지)
   - [ ] 모든 /api/admin/* 라우트에 admin role 검증
   - [ ] orders 테이블 RLS 동작 (anon 접근 차단)

3. UI 점검:
   - [ ] 보라색/violet/purple 계열 색상이 어디에도 사용되지 않았는지 grep으로 확인
   - [ ] 모바일에서 모든 페이지 정상 표시
   - [ ] 로딩 상태, 에러 상태 UX 처리

4. README.md 작성:
   - 프로젝트 개요
   - 환경 변수 설명
   - 로컬 실행 방법 (pnpm install / pnpm dev)
   - Supabase 마이그레이션 실행 방법
   - 첫 관리자 계정 생성 방법 (Supabase 대시보드에서 user 추가 + SQL로 role 부여)
   - Vercel 배포 가이드

5. Vercel 배포 준비:
   - .env.local 값을 Vercel 환경 변수로 등록
   - 빌드 명령: pnpm build
   - Supabase Auth Redirect URL에 배포 도메인 추가
```

---

## 막혔을 때 쓸 디버깅 프롬프트

```
다음 에러가 발생함:
[에러 메시지 또는 스크린샷 설명을 그대로 붙여넣기]

원인 분석해주고, 어떤 파일의 어떤 부분을 어떻게 고치면 되는지 보여줘.
관련 파일들 먼저 view로 보고 진행해.
```

```
[페이지명] 페이지가 [현상]임. 의도한 동작은 [기대 동작]임.
관련 코드 보여주고 문제 짚어서 고쳐줘.
```

---

## 참고: 디자인 시안을 Pencil로 확인하고 싶을 때

```
Pencil MCP로 [페이지명] 디자인 시안을 먼저 만들어줘.
보라색 절대 사용 금지. orange 또는 green 톤으로.
시안 확인 후 그 디자인을 기반으로 Next.js 컴포넌트 작성해줘.
```
