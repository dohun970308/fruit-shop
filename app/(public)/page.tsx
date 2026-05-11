import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/public/ProductCard';
import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/types';

export const revalidate = 60;

async function fetchActiveProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, sort_order, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[home] products fetch error:', error.message);
    return [];
  }
  return (data ?? []) as Product[];
}

export default async function HomePage() {
  const products = await fetchActiveProducts();

  return (
    <>
      <section className="bg-gradient-to-b from-orange-50 to-stone-50">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
              <span className="text-orange-600">푸르고</span>,
              <br className="md:hidden" />
              {' '}가장 신선한 제철 과일.
            </h1>
            <p className="mt-5 text-base text-stone-600 md:text-lg">
              푸르고가 농장에서 바로 보내드리는 제철 과일을 만나보세요.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="#products">지금 주문하기</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="container py-12 md:py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 md:text-3xl">전체 상품</h2>
            <p className="mt-1 text-sm text-stone-600">
              엄선한 제철 과일을 신선하게 보내드려요.
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500">
            아직 등록된 상품이 없습니다.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
