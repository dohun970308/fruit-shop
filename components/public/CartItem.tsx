'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantityInput } from '@/components/public/QuantityInput';
import { ProductImagePlaceholder } from '@/components/public/ProductCard';
import { formatPrice } from '@/lib/format';
import type { CartItem as CartItemType } from '@/lib/cart';

type Props = {
  item: CartItemType;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
};

export function CartItem({ item, onQuantityChange, onRemove }: Props) {
  const subtotal = item.price * item.quantity;

  return (
    <div className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4">
      <Link
        href={`/products/${item.productId}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:size-24"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <ProductImagePlaceholder />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/products/${item.productId}`}
              className="block truncate text-sm font-semibold text-stone-900 hover:text-orange-600 sm:text-base"
            >
              {item.name}
            </Link>
            <div className="mt-1 text-xs text-stone-500 sm:text-sm">
              단가 {formatPrice(item.price)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-stone-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => onRemove(item.productId)}
            aria-label="삭제"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <QuantityInput
            value={item.quantity}
            onChange={(next) => onQuantityChange(item.productId, next)}
            size="sm"
            ariaLabel={`${item.name} 수량`}
          />
          <div className="text-base font-bold text-stone-900 sm:text-lg">
            {formatPrice(subtotal)}
          </div>
        </div>
      </div>
    </div>
  );
}
