import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/admin/ProductForm';

export default function AdminProductNewPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/admin/products">
            <ArrowLeft className="size-4" />
            상품 목록
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">상품 추가</h1>
        <p className="text-sm text-stone-600">새 상품의 정보를 입력해 주세요.</p>
      </div>

      <ProductForm mode="new" />
    </div>
  );
}
