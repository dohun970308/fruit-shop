'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ArrowLeftRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { OrderStatus } from '@/lib/types';

type Props = {
  orderId: string;
  orderNo: string;
  status: OrderStatus;
};

export function OrderDetailActions({ orderId, orderNo, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [, startTransition] = useTransition();

  const nextStatus: OrderStatus = status === 'RECEIVED' ? 'DELIVERED' : 'RECEIVED';
  const toggleLabel =
    status === 'RECEIVED' ? '배송 완료로 변경' : '주문 접수로 되돌리기';

  async function handleToggleStatus() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? '상태 변경에 실패했습니다.');
        return;
      }
      toast.success('상태가 변경되었습니다.');
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      toast.error('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? '삭제에 실패했습니다.');
        return;
      }
      toast.success('주문이 삭제되었습니다.');
      setConfirmOpen(false);
      router.replace('/admin/orders');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={handleToggleStatus} disabled={busy}>
        <ArrowLeftRight className="size-4" />
        {toggleLabel}
      </Button>
      <Button
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
      >
        <Trash2 className="size-4" />
        주문 삭제
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>주문을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono">{orderNo}</span> 주문과 주문 상품이 영구 삭제됩니다.
              되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
