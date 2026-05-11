'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS = [
  { value: 'all', label: '전체 상태' },
  { value: 'RECEIVED', label: '주문 접수' },
  { value: 'DELIVERED', label: '배송 완료' },
];

const PERIOD_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
  { value: 'all', label: '전체 기간' },
];

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const initialQ = params.get('q') ?? '';
  const [q, setQ] = useState(initialQ);

  // URL → input 역동기 (네비게이션으로 q가 변하면 따라가도록)
  useEffect(() => {
    setQ(params.get('q') ?? '');
  }, [params]);

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === '' || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete('page'); // 필터/검색 바뀌면 1페이지로
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam('q', q.trim() || null);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="flex gap-2">
        <Select
          value={params.get('status') ?? 'all'}
          onValueChange={(v) => updateParam('status', v)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get('period') ?? 'all'}
          onValueChange={(v) => updateParam('period', v)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={submitSearch} className="flex flex-1 gap-2 sm:max-w-md">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름·연락처·주문번호 검색"
            className="pl-9 pr-9"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                updateParam('q', null);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              aria-label="검색어 지우기"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>
    </div>
  );
}
