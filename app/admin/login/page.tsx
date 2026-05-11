'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createClient } from '@/lib/supabase/client';

const loginSchema = z.object({
  email: z.string().trim().email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});
type LoginInput = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') ?? '/admin';
  const error = params.get('error');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (error === 'forbidden') {
      toast.error('관리자 권한이 없는 계정입니다.');
    }
  }, [error]);

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInError || !data.user) {
      toast.error('로그인에 실패했습니다.', {
        description: signInError?.message ?? '이메일과 비밀번호를 확인해 주세요.',
      });
      setSubmitting(false);
      return;
    }

    const role = (data.user.app_metadata as { role?: string } | undefined)?.role;
    if (role !== 'admin') {
      await supabase.auth.signOut();
      toast.error('관리자 권한이 없는 계정입니다.');
      setSubmitting(false);
      return;
    }

    toast.success('환영합니다.');
    router.replace(redirectTo.startsWith('/admin') ? redirectTo : '/admin');
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          <LogIn className="size-4" />
          {submitting ? '로그인 중…' : '로그인'}
        </Button>
      </form>
    </Form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="text-xs text-stone-500 hover:text-orange-600">
            ← 메인으로
          </Link>
          <CardTitle className="mt-2 flex items-center gap-2 text-2xl">
            <span aria-hidden>🍊</span>
            관리자 로그인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-40 animate-pulse rounded bg-stone-100" />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
