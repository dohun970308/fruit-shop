'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

function CompleteInner() {
  const params = useSearchParams();
  const orderNo = params.get('orderNo') ?? '';

  async function copy() {
    if (!orderNo) return;
    try {
      await navigator.clipboard.writeText(orderNo);
      toast.success('주문번호를 복사했습니다.');
    } catch {
      toast.error('복사에 실패했어요. 수동으로 복사해 주세요.');
    }
  }

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-100">
          <Check className="size-10 text-green-600" strokeWidth={3} />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-stone-900 md:text-3xl">
          주문이 접수되었습니다
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          입력하신 연락처로 곧 안내드릴 예정입니다.
        </p>

        {orderNo ? (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wider text-stone-500">
              주문번호
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <code className="break-all font-mono text-lg font-semibold text-stone-900">
                {orderNo}
              </code>
              <Button variant="outline" size="sm" onClick={copy}>
                <Copy className="size-4" />
                복사
              </Button>
            </div>
            <p className="mt-3 text-xs text-stone-500">
              주문 조회 시 이름과 연락처로 조회됩니다. 주문번호는 참고용으로 보관해 주세요.
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            주문번호 정보가 없습니다. 주문 조회 페이지에서 이름과 연락처로 확인해 주세요.
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/orders/lookup">주문 조회하기</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">쇼핑 계속하기</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense fallback={<div className="container py-12" />}>
      <CompleteInner />
    </Suspense>
  );
}
