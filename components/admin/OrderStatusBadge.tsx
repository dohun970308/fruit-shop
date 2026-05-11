import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/lib/types';

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  RECEIVED: {
    label: '주문 접수',
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  },
  DELIVERED: {
    label: '배송 완료',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STYLES[status];
  return (
    <Badge variant="secondary" className={s.className}>
      {s.label}
    </Badge>
  );
}

export function orderStatusLabel(status: OrderStatus): string {
  return STYLES[status].label;
}
