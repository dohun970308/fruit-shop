import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createServiceClient } from '@/lib/supabase/service';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

async function loadProducts() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, image_url, sort_order, is_active, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[admin products] query error:', error.message);
    return [];
  }
  return data ?? [];
}

export default async function AdminProductsPage() {
  const products = await loadProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">상품 관리</h1>
          <p className="mt-1 text-sm text-stone-600">
            총 {products.length.toLocaleString('ko-KR')}개의 상품
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            상품 추가
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {products.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-medium text-stone-900">등록된 상품이 없습니다</p>
            <p className="mt-1 text-sm text-stone-500">우측 상단에서 상품을 추가해 보세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">이미지</TableHead>
                  <TableHead className="min-w-[200px]">상품명</TableHead>
                  <TableHead className="min-w-[120px] text-right">가격</TableHead>
                  <TableHead className="min-w-[100px] text-right">진열순서</TableHead>
                  <TableHead className="min-w-[80px]">노출</TableHead>
                  <TableHead className="min-w-[120px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="relative size-14 overflow-hidden rounded-lg bg-stone-100">
                        {p.image_url ? (
                          <Image
                            src={p.image_url}
                            alt={p.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 text-2xl">
                            <span aria-hidden>🍎</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-medium text-stone-900 hover:text-orange-600"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatPrice(p.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-stone-600">
                      {p.sort_order}
                    </TableCell>
                    <TableCell>
                      {p.is_active ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 hover:bg-green-100"
                        >
                          노출 중
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-stone-100 text-stone-600">
                          숨김
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/products/${p.id}`}>수정</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
