import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

type Props = {
  product: Pick<Product, 'id' | 'name' | 'price' | 'image_url'>;
};

export function ProductCard({ product }: Props) {
  return (
    <Card className="group overflow-hidden border-stone-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ProductImagePlaceholder />
          )}
        </div>
      </Link>
      <CardContent className="space-y-3 p-4">
        <Link
          href={`/products/${product.id}`}
          className="block text-base font-semibold text-stone-900 hover:text-orange-600"
        >
          {product.name}
        </Link>
        <div className="text-lg font-bold text-orange-600">{formatPrice(product.price)}</div>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/products/${product.id}`}>상세보기</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProductImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 text-5xl">
      <span aria-hidden>🍎</span>
    </div>
  );
}
