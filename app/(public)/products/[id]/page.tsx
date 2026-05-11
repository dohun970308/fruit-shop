import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import {
  AddToCartButtons,
} from '@/components/public/AddToCartButtons';
import { ProductImagePlaceholder } from '@/components/public/ProductCard';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

export const revalidate = 60;

async function fetchProduct(id: string): Promise<Product | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, sort_order, is_active, created_at, updated_at')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[product detail] fetch error:', error.message);
    return null;
  }
  return (data as Product | null) ?? null;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  if (!product) notFound();

  return (
    <div className="container py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-orange-600"
      >
        <ChevronLeft className="size-4" />
        전체 상품으로
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <ProductImagePlaceholder />
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">{product.name}</h1>
          <div className="mt-3 text-3xl font-bold text-orange-600">
            {formatPrice(product.price)}
          </div>

          {product.description && (
            <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 md:text-base">
              {product.description}
            </p>
          )}

          <div className="mt-8 border-t border-stone-200 pt-6">
            <AddToCartButtons product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
