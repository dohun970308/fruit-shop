'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  CART_UPDATED_EVENT,
  type CartItem as CartItemType,
  clearCart,
  getCart,
} from '@/lib/cart';
import { formatPhone, formatPrice, normalizePhone } from '@/lib/format';
import { checkoutFormSchema, type CheckoutFormInput } from '@/lib/validators';

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItemType[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { customerName: '', customerPhone: '', shippingAddress: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    const sync = () => setItems(getCart());
    sync();
    setLoaded(true);
    window.addEventListener(CART_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (loaded && items.length === 0 && !submitting) {
      toast.info('장바구니가 비어있습니다.');
      router.replace('/cart');
    }
  }, [loaded, items.length, router, submitting]);

  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  async function onSubmit(values: CheckoutFormInput) {
    if (items.length === 0) {
      toast.error('장바구니가 비어있습니다.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: values.customerName,
          customerPhone: normalizePhone(values.customerPhone),
          shippingAddress: values.shippingAddress,
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(errBody?.error ?? '주문 접수에 실패했습니다.');
        setSubmitting(false);
        return;
      }

      const { orderNo } = (await res.json()) as { orderNo: string };
      clearCart();
      router.push(`/checkout/complete?orderNo=${encodeURIComponent(orderNo)}`);
    } catch (err) {
      console.error(err);
      toast.error('주문 접수 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  }

  if (!loaded || items.length === 0) {
    return (
      <div className="container py-12">
        <div className="h-8 w-32 animate-pulse rounded bg-stone-200" />
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">주문하기</h1>
      <p className="mt-1 text-sm text-stone-600">
        결제는 진행하지 않으며, 입력하신 연락처로 따로 안내드립니다.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-900">주문자 정보</h2>
              <div className="mt-4 space-y-4">
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
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>배송 주소</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="도/시, 군/구, 도로명/번지, 상세 주소까지 입력해 주세요."
                          rows={4}
                          autoComplete="street-address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          </form>
        </Form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">주문 상품</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((it) => (
                <li
                  key={it.productId}
                  className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-stone-900">{it.name}</div>
                    <div className="mt-0.5 text-xs text-stone-500">
                      {formatPrice(it.price)} × {it.quantity}
                    </div>
                  </div>
                  <div className="shrink-0 font-medium text-stone-900 tabular-nums">
                    {formatPrice(it.price * it.quantity)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-baseline justify-between border-t border-stone-200 pt-4">
              <span className="font-semibold text-stone-900">합계</span>
              <span className="text-2xl font-bold text-orange-600 tabular-nums">
                {formatPrice(total)}
              </span>
            </div>

            <Button
              size="lg"
              className="mt-6 w-full"
              onClick={form.handleSubmit(onSubmit)}
              disabled={submitting}
            >
              {submitting ? '처리 중…' : '주문하기'}
            </Button>
            <p className="mt-3 text-xs text-stone-500">
              주문 후 입력하신 연락처로 안내드립니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
