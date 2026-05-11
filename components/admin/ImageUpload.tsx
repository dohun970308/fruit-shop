'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
};

export function ImageUpload({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? '이미지 업로드에 실패했습니다.');
        return;
      }
      const data = (await res.json()) as { url: string };
      onChange(data.url);
      toast.success('이미지가 업로드되었습니다.');
    } catch (err) {
      console.error(err);
      toast.error('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={handleFile}
        disabled={disabled || uploading}
      />

      {value ? (
        <div className="group relative aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
          <Image
            src={value}
            alt="상품 이미지 미리보기"
            fill
            sizes="280px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled || uploading}
            className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100 disabled:opacity-30"
            aria-label="이미지 제거"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex aspect-square w-full max-w-[280px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 text-stone-500 transition-colors hover:border-orange-400 hover:bg-orange-50/40 hover:text-orange-600 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            <ImagePlus className="size-8" />
          )}
          <span className="text-sm font-medium">
            {uploading ? '업로드 중…' : '이미지 선택'}
          </span>
          <span className="text-xs text-stone-400">5MB 이하 · jpg, png, webp</span>
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {value ? '이미지 변경' : '이미지 업로드'}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            disabled={disabled || uploading}
          >
            제거
          </Button>
        )}
      </div>
    </div>
  );
}
