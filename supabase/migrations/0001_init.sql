-- =============================================================================
-- 0001_init.sql — 과일 판매 사이트 초기 스키마
-- =============================================================================
-- 테이블: products, orders, order_items
-- RLS:    products는 anon/authenticated에 is_active=true만 SELECT 허용.
--         orders, order_items는 anon/authenticated 모두 차단.
--         (모든 주문 관련 작업은 서버 라우트에서 service_role 키로만 수행)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) products — 상품
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       integer not null,
  image_url   text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_sort_idx
  on public.products (sort_order, created_at);

-- -----------------------------------------------------------------------------
-- 2) orders — 주문
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_no         text not null unique,
  customer_name    text not null,
  customer_phone   text not null,
  shipping_address text not null,
  total_amount     integer not null,
  status           text not null default 'RECEIVED'
                   check (status in ('RECEIVED', 'DELIVERED')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_lookup_idx
  on public.orders (customer_name, customer_phone);
create index if not exists orders_created_idx
  on public.orders (created_at desc);
create index if not exists orders_status_idx
  on public.orders (status);

-- -----------------------------------------------------------------------------
-- 3) order_items — 주문 상품 (한 주문에 여러 상품)
-- -----------------------------------------------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price   integer not null,
  quantity     integer not null check (quantity > 0),
  subtotal     integer not null,
  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_idx
  on public.order_items (order_id);

-- -----------------------------------------------------------------------------
-- 4) updated_at 자동 갱신 트리거
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- -----------------------------------------------------------------------------
-- products — anon/authenticated은 is_active=true 행만 SELECT
-- -----------------------------------------------------------------------------
drop policy if exists "products_select_active" on public.products;
create policy "products_select_active"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

-- -----------------------------------------------------------------------------
-- orders, order_items — anon/authenticated은 모든 작업 차단
-- (policy를 아예 만들지 않으므로 service_role 외엔 접근 불가)
-- service_role은 RLS를 우회하므로 별도 policy 불필요.
-- =============================================================================

-- =============================================================================
-- GRANT
-- =============================================================================
-- products는 anon/authenticated에 SELECT 허용
grant select on public.products to anon, authenticated;

-- orders, order_items는 GRANT 하지 않음 (service_role만 접근)
revoke all on public.orders      from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
