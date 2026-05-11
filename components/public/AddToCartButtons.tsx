'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { QuantityInput } from '@/components/public/QuantityInput';
import { addToCart } from '@/lib/cart';
import type { Product } from '@/lib/types';

type Props = {
  product: Pick<Product, 'id' | 'name' | 'price' | 'image_url'>;
};

export function AddToCartButtons({ product }: Props) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  function add() {
    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url,
      },
      quantity,
    );
  }

  function handleAddToCart() {
    add();
    toast.success('장바구니에 담겼습니다', {
      description: `${product.name} ${quantity}개`,
      action: {
        label: '장바구니 보기',
        onClick: () => router.push('/cart'),
      },
    });
  }

  function handleBuyNow() {
    add();
    router.push('/cart');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-stone-700">수량</span>
        <QuantityInput value={quantity} onChange={setQuantity} ariaLabel="주문 수량" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" size="lg" className="flex-1" onClick={handleAddToCart}>
          <ShoppingCart className="size-4" />
          장바구니 담기
        </Button>
        <Button size="lg" className="flex-1" onClick={handleBuyNow}>
          바로 주문하기
        </Button>
      </div>
    </div>
  );
}
