import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { OrderFilters } from '@/components/admin/OrderFilters';
import { OrderRow, type AdminOrderRowData } from '@/components/admin/OrderRow';
import { createServiceClient } from '@/lib/supabase/service';
import { normalizePhone } from '@/lib/format';
import { periodSinceISO, type PeriodKey } from '@/lib/dateRange';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

type SearchParams = {
  status?: string;
  period?: string;
  q?: string;
  page?: string;
};

function parseStatus(v: string | undefined): OrderStatus | null {
  return v === 'RECEIVED' || v === 'DELIVERED' ? v : null;
}

function parsePeriod(v: string | undefined): PeriodKey {
  if (v === 'today' || v === 'week' || v === 'month' || v === 'all') return v;
  return 'all';
}

function parsePage(v: string | undefined): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

// PostgREST ilike에서 안전한 문자열로 변환 (영향 미치는 문자 escape)
function escapeIlike(input: string): string {
  return input.replace(/[\\%_,]/g, (m) => `\\${m}`);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const status = parseStatus(searchParams.status);
  const period = parsePeriod(searchParams.period);
  const q = (searchParams.q ?? '').trim();
  const page = parsePage(searchParams.page);

  const supabase = createServiceClient();
  const sinceISO = periodSinceISO(period);

  // 검색어가 전화번호로 들어올 수 있어 정규화한 버전도 함께 OR 매칭에 사용
  const phoneDigits = normalizePhone(q);

  let query = supabase
    .from('orders')
    .select(
      'id, order_no, created_at, customer_name, customer_phone, shipping_address, total_amount, status',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (sinceISO) query = query.gte('created_at', sinceISO);

  if (q) {
    const term = `%${escapeIlike(q)}%`;
    const orParts = [`customer_name.ilike.${term}`, `order_no.ilike.${term}`];
    if (phoneDigits) {
      orParts.push(`customer_phone.ilike.%${escapeIlike(phoneDigits)}%`);
    }
    query = query.or(orParts.join(','));
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: orders, count, error } = await query;

  if (error) {
    console.error('[admin orders] query error:', error.message);
  }

  // 각 주문의 첫 상품명 + 개수
  let itemsByOrder = new Map<string, { product_name: string; count: number }>();
  if (orders && orders.length > 0) {
    const ids = orders.map((o) => o.id);
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('order_id, product_name, created_at')
      .in('order_id', ids)
      .order('created_at', { ascending: true });
    if (itemsErr) {
      console.error('[admin orders] items query error:', itemsErr.message);
    }
    const map = new Map<string, { product_name: string; count: number }>();
    for (const it of items ?? []) {
      const cur = map.get(it.order_id);
      if (!cur) map.set(it.order_id, { product_name: it.product_name, count: 1 });
      else cur.count += 1;
    }
    itemsByOrder = map;
  }

  const rows: AdminOrderRowData[] = (orders ?? []).map((o) => {
    const it = itemsByOrder.get(o.id);
    return {
      id: o.id,
      orderNo: o.order_no,
      createdAt: o.created_at,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      shippingAddress: o.shipping_address,
      totalAmount: o.total_amount,
      status: o.status as OrderStatus,
      firstItemName: it?.product_name ?? '(상품 없음)',
      itemCount: it?.count ?? 0,
    };
  });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function buildPageHref(p: number): string {
    const next = new URLSearchParams();
    if (status) next.set('status', status);
    if (period !== 'all') next.set('period', period);
    if (q) next.set('q', q);
    if (p > 1) next.set('page', String(p));
    const qs = next.toString();
    return qs ? `/admin/orders?${qs}` : '/admin/orders';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">주문 관리</h1>
          <p className="mt-1 text-sm text-stone-600">총 {total.toLocaleString('ko-KR')}건</p>
        </div>
      </div>

      <OrderFilters />

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-medium text-stone-900">조회된 주문이 없습니다</p>
            <p className="mt-1 text-sm text-stone-500">필터나 검색어를 바꿔 다시 시도해 보세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">주문일시</TableHead>
                  <TableHead className="min-w-[140px]">구매자</TableHead>
                  <TableHead className="min-w-[180px]">주문 상품</TableHead>
                  <TableHead className="min-w-[200px]">배송 주소</TableHead>
                  <TableHead className="min-w-[100px] text-right">합계</TableHead>
                  <TableHead className="min-w-[130px]">상태</TableHead>
                  <TableHead className="min-w-[120px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <OrderRow key={r.id} order={r} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button asChild variant="outline" size="sm" disabled={!hasPrev}>
            {hasPrev ? (
              <Link href={buildPageHref(page - 1)}>
                <ChevronLeft className="size-4" />
                이전
              </Link>
            ) : (
              <span>
                <ChevronLeft className="size-4" />
                이전
              </span>
            )}
          </Button>
          <div className="px-3 text-sm text-stone-600 tabular-nums">
            {page} / {totalPages}
          </div>
          <Button asChild variant="outline" size="sm" disabled={!hasNext}>
            {hasNext ? (
              <Link href={buildPageHref(page + 1)}>
                다음
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span>
                다음
                <ChevronRight className="size-4" />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
