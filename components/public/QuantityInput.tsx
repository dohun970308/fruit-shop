'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
};

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  className,
  ariaLabel = '수량',
}: Props) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.floor(n)));

  const dec = () => onChange(clamp(value - 1));
  const inc = () => onChange(clamp(value + 1));

  const btnSize = size === 'sm' ? 'size-8' : 'size-10';
  const inputSize = size === 'sm' ? 'h-8 w-12' : 'h-10 w-14';

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={btnSize}
        onClick={dec}
        disabled={value <= min}
        aria-label="수량 감소"
      >
        <Minus className="size-4" />
      </Button>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(min);
            return;
          }
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) onChange(clamp(parsed));
        }}
        className={cn('text-center tabular-nums', inputSize)}
        aria-label={ariaLabel}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={btnSize}
        onClick={inc}
        disabled={value >= max}
        aria-label="수량 증가"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
