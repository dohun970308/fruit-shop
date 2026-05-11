'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/components/public/CartItem';
import {
  CART_UPDATED_EVENT,
  type CartItem as CartItemType,
  getCart,
  removeFromCart,
  updateQuantity,
} from '@/lib/cart';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const [items, setItems] = useState<CartItemType[]>([]);
  const [loaded, setLoaded] = useState(false);

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

  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  if (!loaded) {
    return (
      <div className="container py-12">
        <div className="h-8 w-32 animate-pulse rounded bg-stone-200" />
        <div className="mt-8 space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-orange-50">
            <ShoppingBag className="size-10 text-orange-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-stone-900">장바구니가 비어있습니다</h1>
          <p className="mt-2 text-stone-600">마음에 드는 과일을 담아보세요.</p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/">쇼핑 계속하기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">장바구니</h1>
      <p className="mt-1 text-sm text-stone-600">총 {items.length}개의 상품</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onQuantityChange={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">결제 요약</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <dt>상품 합계</dt>
                <dd className="tabular-nums">{formatPrice(total)}</dd>
              </div>
              <div className="flex justify-between text-stone-600">
                <dt>배송비</dt>
                <dd>주문 후 안내</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-stone-200 pt-4">
              <span className="font-semibold text-stone-900">합계</span>
              <span className="text-2xl font-bold text-orange-600 tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
            <div className="mt-6 space-y-2">
              <Button size="lg" className="w-full" asChild>
                <Link href="/checkout">주문하기</Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link href="/">쇼핑 계속하기</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
