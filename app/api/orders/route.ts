import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createServiceClient } from '@/lib/supabase/service';
import { createOrderSchema } from '@/lib/validators';
import { generateOrderNo } from '@/lib/orderNo';

export const runtime = 'nodejs';

const MAX_ORDER_NO_RETRY = 5;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = createOrderSchema.parse(body);
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

  // 1) 제출된 productId들의 실제 상품 정보를 서버에서 조회 (가격 위변조 방지)
  const productIds = Array.from(new Set(parsed.items.map((it) => it.productId)));
  const { data: products, error: productsErr } = await supabase
    .from('products')
    .select('id, name, price, is_active')
    .in('id', productIds);

  if (productsErr) {
    console.error('[POST /api/orders] products fetch error:', productsErr.message);
    return NextResponse.json({ error: '상품 정보를 불러오지 못했습니다.' }, { status: 500 });
  }

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  for (const item of parsed.items) {
    const p = productMap.get(item.productId);
    if (!p || !p.is_active) {
      return NextResponse.json(
        { error: '판매 중이 아닌 상품이 포함되어 있습니다.' },
        { status: 409 },
      );
    }
  }

  // 2) 합계 산출 + order_items payload (가격/이름 스냅샷)
  const itemsPayload = parsed.items.map((it) => {
    const p = productMap.get(it.productId)!;
    return {
      product_id: p.id,
      product_name: p.name,
      unit_price: p.price,
      quantity: it.quantity,
      subtotal: p.price * it.quantity,
    };
  });
  const totalAmount = itemsPayload.reduce((sum, it) => sum + it.subtotal, 0);

  // 3) order_no 생성 — unique 충돌 시 재시도
  let orderNo = '';
  let orderId = '';
  let lastError: string | null = null;

  for (let attempt = 0; attempt < MAX_ORDER_NO_RETRY; attempt++) {
    orderNo = generateOrderNo();
    const { data: inserted, error: insertErr } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        customer_name: parsed.customerName,
        customer_phone: parsed.customerPhone,
        shipping_address: parsed.shippingAddress,
        total_amount: totalAmount,
        status: 'RECEIVED',
      })
      .select('id, order_no')
      .single();

    if (!insertErr && inserted) {
      orderId = inserted.id;
      break;
    }

    // 23505 = unique_violation (order_no 충돌)
    if (insertErr && insertErr.code === '23505') {
      lastError = insertErr.message;
      continue;
    }

    console.error('[POST /api/orders] orders insert error:', insertErr?.message);
    return NextResponse.json({ error: '주문 저장에 실패했습니다.' }, { status: 500 });
  }

  if (!orderId) {
    console.error('[POST /api/orders] order_no collision exhausted:', lastError);
    return NextResponse.json(
      { error: '주문번호 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }

  // 4) order_items 일괄 insert. 실패 시 부모 orders도 cascade 정리.
  const { error: itemsErr } = await supabase
    .from('order_items')
    .insert(itemsPayload.map((it) => ({ ...it, order_id: orderId })));

  if (itemsErr) {
    console.error('[POST /api/orders] order_items insert error:', itemsErr.message);
    await supabase.from('orders').delete().eq('id', orderId);
    return NextResponse.json({ error: '주문 상품 저장에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ orderNo }, { status: 201 });
}
