'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPhone, formatPrice, normalizePhone } from '@/lib/format';
import { lookupFormSchema, type LookupFormInput } from '@/lib/validators';
import type { LookupOrderSummary } from '@/app/api/orders/lookup/route';

type Submission = LookupFormInput;

const STATUS_STYLES = {
  RECEIVED: { label: '주문 접수', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
  DELIVERED: { label: '배송 완료', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
} as const;

export default function OrdersLookupPage() {
  const [results, setResults] = useState<LookupOrderSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState<Submission | null>(null);

  const form = useForm<LookupFormInput>({
    resolver: zodResolver(lookupFormSchema),
    defaultValues: { customerName: '', customerPhone: '' },
    mode: 'onTouched',
  });

  async function onSubmit(values: LookupFormInput) {
    setSearching(true);
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: values.customerName,
          customerPhone: normalizePhone(values.customerPhone),
        }),
      });

      if (res.status === 429) {
        toast.error('요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? '조회에 실패했습니다.');
        return;
      }

      const data = (await res.json()) as { orders: LookupOrderSummary[] };
      setResults(data.orders);
      setSubmittedQuery(values);
    } catch (err) {
      console.error(err);
      toast.error('조회 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="container py-8 md:py-12">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">주문 조회</h1>
      <p className="mt-1 text-sm text-stone-600">
        주문 시 입력하신 이름과 연락처로 조회됩니다.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input placeholder="홍길동" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>연락처</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="010-1234-5678"
                      inputMode="tel"
                      autoComplete="tel"
                      value={field.value}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      maxLength={13}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" disabled={searching} className="md:mb-[2px]">
              <Search className="size-4" />
              {searching ? '조회 중…' : '조회하기'}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-8">
        {results === null ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 p-12 text-center text-sm text-stone-500">
            조회할 정보를 입력해 주세요.
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
            <p className="text-base font-medium text-stone-900">주문 내역이 없습니다</p>
            <p className="mt-1 text-sm text-stone-500">
              {submittedQuery?.customerName}님의 이름·연락처로 조회된 주문이 없어요.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문번호</TableHead>
                  <TableHead>주문일시</TableHead>
                  <TableHead>주문 상품</TableHead>
                  <TableHead className="text-right">합계</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((o) => {
                  const status = STATUS_STYLES[o.status];
                  const extra = o.itemCount > 1 ? ` 외 ${o.itemCount - 1}건` : '';
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs md:text-sm">{o.orderNo}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-stone-600">
                        {new Date(o.createdAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {o.firstItemName}
                        {extra && <span className="text-stone-500">{extra}</span>}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatPrice(o.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className} variant="secondary">
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
