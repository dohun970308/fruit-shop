import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/admin/ProductForm';
import { createServiceClient } from '@/lib/supabase/service';
import type { ProductFormInput } from '@/lib/validators';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  if (!UUID_RE.test(params.id)) notFound();

  const supabase = createServiceClient();
  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, sort_order, is_active')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    console.error('[admin product edit] error:', error.message);
  }
  if (!product) notFound();

  const initialValues: ProductFormInput = {
    name: product.name,
    description: product.description ?? '',
    price: product.price,
    sortOrder: product.sort_order,
    isActive: product.is_active,
    imageUrl: product.image_url ?? '',
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/admin/products">
            <ArrowLeft className="size-4" />
            상품 목록
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">{product.name}</h1>
        <p className="text-sm text-stone-600">상품 정보를 수정합니다.</p>
      </div>

      <ProductForm mode="edit" productId={product.id} initialValues={initialValues} />
    </div>
  );
}
