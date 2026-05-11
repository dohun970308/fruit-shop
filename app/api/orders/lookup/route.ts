import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createServiceClient } from '@/lib/supabase/service';
import { lookupOrderSchema } from '@/lib/validators';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { normalizePhone } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

export const runtime = 'nodejs';

export type LookupOrderSummary = {
  id: string;
  orderNo: string;
  createdAt: string;
  totalAmount: number;
  status: OrderStatus;
  firstItemName: string;
  itemCount: number;
};

export async function POST(req: Request) {
  // 분당 10회/IP
  const ip = getClientIp(req);
  const rl = rateLimit(`orders.lookup:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  // UI에서 하이픈 포함된 값이 올 수 있어 정규화 후 strict 스키마로 검증
  const raw = body as { customerName?: string; customerPhone?: string };
  const candidate = {
    customerName: typeof raw.customerName === 'string' ? raw.customerName.trim() : '',
    customerPhone:
      typeof raw.customerPhone === 'string' ? normalizePhone(raw.customerPhone) : '',
  };

  let parsed;
  try {
    parsed = lookupOrderSchema.parse(candidate);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: '입력값을 확인해 주세요.', issues: err.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: '입력값을 확인해 주세요.' }, { status: 422 });
  }

  const supabase = createServiceClient();

  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('id, order_no, created_at, total_amount, status')
    .eq('customer_name', parsed.customerName)
    .eq('customer_phone', parsed.customerPhone)
    .order('created_at', { ascending: false })
    .limit(100);

  if (ordersErr) {
    console.error('[POST /api/orders/lookup] orders fetch error:', ordersErr.message);
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ orders: [] satisfies LookupOrderSummary[] });
  }

  // order_items에서 첫 상품명 + 총 개수 산출 (한 번에 모아 조회 후 메모리에서 그룹)
  const orderIds = orders.map((o) => o.id);
  const { data: items, error: itemsErr } = await supabase
    .from('order_items')
    .select('order_id, product_name, quantity, created_at')
    .in('order_id', orderIds)
    .order('created_at', { ascending: true });

  if (itemsErr) {
    console.error('[POST /api/orders/lookup] items fetch error:', itemsErr.message);
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 });
  }

  const itemsByOrder = new Map<string, { product_name: string }[]>();
  for (const it of items ?? []) {
    const list = itemsByOrder.get(it.order_id) ?? [];
    list.push({ product_name: it.product_name });
    itemsByOrder.set(it.order_id, list);
  }

  const summaries: LookupOrderSummary[] = orders.map((o) => {
    const ois = itemsByOrder.get(o.id) ?? [];
    return {
      id: o.id,
      orderNo: o.order_no,
      createdAt: o.created_at,
      totalAmount: o.total_amount,
      status: o.status as OrderStatus,
      firstItemName: ois[0]?.product_name ?? '(상품 없음)',
      itemCount: ois.length,
    };
  });

  return NextResponse.json({ orders: summaries });
}
