'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CART_UPDATED_EVENT, getCartCount } from '@/lib/cart';

const NAV_LINKS = [
  { href: '/', label: '전체 상품' },
  { href: '/orders/lookup', label: '주문 조회' },
];

function useCartCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const sync = () => setCount(getCartCount());
    sync();
    window.addEventListener(CART_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return count;
}

export function Header() {
  const cartCount = useCartCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-2xl" aria-hidden>
            🍊
          </span>
          <span>과일 가게</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone-700 hover:text-orange-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <CartLink count={cartCount} />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <CartLink count={cartCount} compact />
          <Button
            variant="ghost"
            size="icon"
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-stone-200 bg-white md:hidden">
          <nav className="container flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-3 text-sm font-medium text-stone-800 hover:bg-orange-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function CartLink({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <Link
      href="/cart"
      className={cn(
        'relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors',
        compact
          ? 'text-stone-800 hover:bg-orange-50'
          : 'bg-orange-500 text-white hover:bg-orange-600',
      )}
      aria-label="장바구니"
    >
      <ShoppingCart className="size-4" />
      {!compact && <span>장바구니</span>}
      {count > 0 && (
        <span
          className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums',
            compact ? 'bg-orange-500 text-white' : 'bg-white text-orange-600',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
