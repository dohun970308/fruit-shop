import Link from 'next/link';
import { ArrowRight, CalendarClock, CheckCircle2, ListOrdered, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { createServiceClient } from '@/lib/supabase/service';
import { formatPhone, formatPrice } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

function startOfTodayKstISO(): string {
  // Asia/Seoul (UTC+9) 기준 오늘 00:00을 UTC ISO 문자열로 변환.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(new Date())
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  );
  return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+09:00`).toISOString();
}

async function loadCounts() {
  const supabase = createServiceClient();
  const todayISO = startOfTodayKstISO();

  const [todayRes, totalRes, receivedRes, deliveredRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayISO),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'RECEIVED'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'DELIVERED'),
  ]);

  return {
    today: todayRes.count ?? 0,
    total: totalRes.count ?? 0,
    received: receivedRes.count ?? 0,
    delivered: deliveredRes.count ?? 0,
  };
}

async function loadRecentOrders() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_no, created_at, customer_name, customer_phone, total_amount, status')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) {
    console.error('[admin dashboard] recent orders error:', error.message);
    return [];
  }
  return data ?? [];
}

const CARDS = [
  {
    key: 'today',
    label: '오늘 주문',
    Icon: CalendarClock,
    accent: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    key: 'total',
    label: '총 주문',
    Icon: ListOrdered,
    accent: 'text-stone-700',
    bg: 'bg-stone-100',
  },
  {
    key: 'received',
    label: '처리 대기',
    Icon: Package,
    accent: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    key: 'delivered',
    label: '배송 완료',
    Icon: CheckCircle2,
    accent: 'text-green-600',
    bg: 'bg-green-50',
  },
] as const;

export default async function AdminDashboardPage() {
  const [counts, recent] = await Promise.all([loadCounts(), loadRecentOrders()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">대시보드</h1>
        <p className="mt-1 text-sm text-stone-600">주문 현황을 한눈에 확인하세요.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => {
          const value = counts[c.key];
          const Icon = c.Icon;
          return (
            <Card key={c.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">{c.label}</CardTitle>
                <div className={`flex size-9 items-center justify-center rounded-lg ${c.bg}`}>
                  <Icon className={`size-4 ${c.accent}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-stone-900 tabular-nums">
                  {value.toLocaleString('ko-KR')}
                </div>
                <p className="mt-1 text-xs text-stone-500">건</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">최근 주문</h2>
            <p className="text-xs text-stone-500">가장 최근에 접수된 주문 5건</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">
              전체 보기
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {recent.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-stone-500">
            아직 주문 내역이 없습니다.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>주문일시</TableHead>
                <TableHead>구매자</TableHead>
                <TableHead className="text-right">합계</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="whitespace-nowrap text-xs text-stone-600 md:text-sm">
                    <div>
                      {new Date(o.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-stone-400">
                      {o.order_no}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium text-stone-900">{o.customer_name}</div>
                    <div className="text-xs text-stone-500">{formatPhone(o.customer_phone)}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatPrice(o.total_amount)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status as OrderStatus} />
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/orders/${o.id}`}>상세</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
