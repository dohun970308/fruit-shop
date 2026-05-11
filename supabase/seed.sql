-- =============================================================================
-- seed.sql — 초기 상품 데이터 (PROJECT_CONTEXT.md 5번)
-- =============================================================================
-- 재실행해도 중복 insert 되지 않도록 name 기준 ON CONFLICT 처리.
-- (products.name에 unique 제약이 없으므로 임시 unique 인덱스를 만들었다가 처리하지 않고,
--  대신 "이미 동일한 name이 있으면 skip"하는 방식으로 처리)
-- =============================================================================

insert into public.products (name, price, sort_order, description)
select v.name, v.price, v.sort_order, v.description
from (values
  ('랜덤 과일 봉지',       10000,  10, '제철 과일을 봉지에 담아드립니다.'),
  ('랜덤 과일 1kg',        30000,  20, '제철 과일 1kg 모음 구성.'),
  ('랜덤 과일 1박스',      50000,  30, '제철 과일을 가득 담은 1박스.'),
  ('선물 세트',           100000,  40, '깔끔한 선물용 과일 세트.'),
  ('고급 선물 세트',      500000,  50, '엄선한 고급 과일 선물 세트.'),
  ('프리미엄 선물 세트', 1000000,  60, '최상급 프리미엄 과일 선물 세트.')
) as v(name, price, sort_order, description)
where not exists (
  select 1 from public.products p where p.name = v.name
);
