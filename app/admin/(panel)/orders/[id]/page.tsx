import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { OrderDetailActions } from '@/components/admin/OrderDetailActions';
import { createServiceClient } from '@/lib/supabase/service';
import { formatPhone, formatPrice } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

// UUID 형식 검증 (이외 값은 404)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!UUID_RE.test(params.id)) notFound();

  const supabase = createServiceClient();

  const [{ data: order, error: orderErr }, { data: items, error: itemsErr }] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, order_no, created_at, customer_name, customer_phone, shipping_address, total_amount, status',
      )
      .eq('id', params.id)
      .maybeSingle(),
    supabase
      .from('order_items')
      .select('id, product_name, unit_price, quantity, subtotal, created_at')
      .eq('order_id', params.id)
      .order('created_at', { ascending: true }),
  ]);

  if (orderErr) {
    console.error('[admin order detail] order error:', orderErr.message);
  }
  if (itemsErr) {
    console.error('[admin order detail] items error:', itemsErr.message);
  }

  if (!order) notFound();

  const status = order.status as OrderStatus;
  const phoneFormatted = formatPhone(order.customer_phone);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/admin/orders">
              <ArrowLeft className="size-4" />
              주문 목록
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-xl font-bold text-stone-900 md:text-2xl">
              {order.order_no}
            </h1>
            <OrderStatusBadge status={status} />
          </div>
          <p className="text-sm text-stone-600">
            {new Date(order.created_at).toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            접수
          </p>
        </div>

        <OrderDetailActions
          orderId={order.id}
          orderNo={order.order_no}
          status={status}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">구매자 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <User className="mt-0.5 size-4 text-stone-400" />
            <div>
              <div className="text-xs text-stone-500">이름</div>
              <div className="font-medium text-stone-900">{order.customer_name}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 size-4 text-stone-400" />
            <div>
              <div className="text-xs text-stone-500">연락처</div>
              <a
                href={`tel:${order.customer_phone}`}
                className="font-medium text-orange-600 hover:underline"
              >
                {phoneFormatted}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3 sm:col-span-2">
            <MapPin className="mt-0.5 size-4 text-stone-400" />
            <div className="min-w-0">
              <div className="text-xs text-stone-500">배송 주소</div>
              <div className="whitespace-pre-wrap break-words font-medium text-stone-900">
                {order.shipping_address}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">주문 상품</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>상품명</TableHead>
                <TableHead className="text-right">단가</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">소계</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items ?? []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium text-stone-900">{it.product_name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(it.unit_price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatPrice(it.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
              {(!items || items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-stone-500">
                    주문 상품 정보가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-baseline justify-end gap-4 border-t border-stone-200 px-6 py-4">
            <span className="text-sm text-stone-600">합계</span>
            <span className="text-2xl font-bold text-orange-600 tabular-nums">
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
