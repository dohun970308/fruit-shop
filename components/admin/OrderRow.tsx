'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
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
import { formatPhone, formatPrice } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

export type AdminOrderRowData = {
  id: string;
  orderNo: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: OrderStatus;
  firstItemName: string;
  itemCount: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderRow({ order }: { order: AdminOrderRowData }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [updating, setUpdating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function handleStatusChange(next: OrderStatus) {
    if (next === status) return;
    const prev = status;
    setStatus(next);
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? '상태 변경에 실패했습니다.');
        setStatus(prev);
        return;
      }
      toast.success('상태가 변경되었습니다.');
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      toast.error('상태 변경 중 오류가 발생했습니다.');
      setStatus(prev);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? '삭제에 실패했습니다.');
        return;
      }
      toast.success('주문이 삭제되었습니다.');
      setConfirmOpen(false);
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  }

  const extra = order.itemCount > 1 ? ` 외 ${order.itemCount - 1}건` : '';

  return (
    <>
      <TableRow>
        <TableCell className="whitespace-nowrap text-xs text-stone-600 md:text-sm">
          <div>{formatDate(order.createdAt)}</div>
          <div className="mt-0.5 font-mono text-[11px] text-stone-400">{order.orderNo}</div>
        </TableCell>
        <TableCell className="text-sm">
          <div className="font-medium text-stone-900">{order.customerName}</div>
          <div className="mt-0.5 text-xs text-stone-500">{formatPhone(order.customerPhone)}</div>
        </TableCell>
        <TableCell className="text-sm">
          {order.firstItemName}
          {extra && <span className="text-stone-500">{extra}</span>}
        </TableCell>
        <TableCell className="max-w-[240px] truncate text-xs text-stone-600">
          {order.shippingAddress}
        </TableCell>
        <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
          {formatPrice(order.totalAmount)}
        </TableCell>
        <TableCell>
          <Select
            value={status}
            onValueChange={(v) => handleStatusChange(v as OrderStatus)}
            disabled={updating}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RECEIVED">주문 접수</SelectItem>
              <SelectItem value="DELIVERED">배송 완료</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/orders/${order.id}`}>상세</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-stone-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => setConfirmOpen(true)}
              aria-label="삭제"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>주문을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono">{order.orderNo}</span> 주문과 주문 상품이 영구
              삭제됩니다. 되돌릴 수 없습니다.
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
    </>
  );
}
