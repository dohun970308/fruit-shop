'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { ImageUpload } from '@/components/admin/ImageUpload';
import { productFormSchema, type ProductFormInput } from '@/lib/validators';
import { formatPrice } from '@/lib/format';

type Props =
  | { mode: 'new'; productId?: undefined; initialValues?: Partial<ProductFormInput> }
  | { mode: 'edit'; productId: string; initialValues: ProductFormInput };

const DEFAULTS: ProductFormInput = {
  name: '',
  description: '',
  price: 0,
  sortOrder: 0,
  isActive: true,
  imageUrl: '',
};

export function ProductForm(props: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { ...DEFAULTS, ...(props.initialValues ?? {}) },
    mode: 'onTouched',
  });

  const pricePreview = form.watch('price');

  async function onSubmit(values: ProductFormInput) {
    setSubmitting(true);
    const payload: ProductFormInput = {
      ...values,
      description: values.description ?? '',
      imageUrl: values.imageUrl ?? '',
    };
    try {
      const url =
        props.mode === 'new'
          ? '/api/admin/products'
          : `/api/admin/products/${props.productId}`;
      const method = props.mode === 'new' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? '저장에 실패했습니다.');
        return;
      }

      if (props.mode === 'new') {
        toast.success('상품이 등록되었습니다.');
        router.replace('/admin/products');
        router.refresh();
      } else {
        toast.success('상품이 수정되었습니다.');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (props.mode !== 'edit') return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${props.productId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? '삭제에 실패했습니다.');
        return;
      }
      toast.success('상품이 삭제되었습니다.');
      setConfirmDelete(false);
      router.replace('/admin/products');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상품명</FormLabel>
                      <FormControl>
                        <Input placeholder="예: 랜덤 과일 1박스" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>설명</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="상품에 대한 설명을 입력하세요."
                          rows={5}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">가격 / 진열</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>가격 (원)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={100}
                          value={Number.isFinite(field.value) ? field.value : 0}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            field.onChange(Number.isFinite(n) ? n : 0);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        표시 미리보기: <span className="font-medium">{formatPrice(pricePreview || 0)}</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>진열 순서</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          step={1}
                          value={Number.isFinite(field.value) ? field.value : 0}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            field.onChange(Number.isFinite(n) ? n : 0);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>숫자가 작을수록 먼저 노출됩니다.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-stone-200 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">노출 여부</FormLabel>
                        <FormDescription>
                          꺼두면 메인 페이지와 상세에 노출되지 않습니다.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle className="text-base">상품 이미지</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          value={field.value ? field.value : null}
                          onChange={(url) => field.onChange(url ?? '')}
                          disabled={submitting || deleting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-6">
          <div>
            {props.mode === 'edit' && (
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting || deleting}
              >
                <Trash2 className="size-4" />
                상품 삭제
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/admin/products')}
              disabled={submitting || deleting}
            >
              취소
            </Button>
            <Button type="submit" disabled={submitting || deleting}>
              <Save className="size-4" />
              {submitting ? '저장 중…' : props.mode === 'new' ? '상품 등록' : '변경 저장'}
            </Button>
          </div>
        </div>

        {props.mode === 'edit' && (
          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>상품을 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  과거 주문의 상품 기록은 스냅샷으로 남아 영향을 받지 않지만, 이 상품은
                  메인/상세 페이지에서 더 이상 보이지 않게 됩니다. 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {deleting ? '삭제 중…' : '삭제'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </form>
    </Form>
  );
}
