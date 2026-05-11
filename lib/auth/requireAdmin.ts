import 'server-only';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function getRole(user: User): string | undefined {
  return (user.app_metadata as { role?: string } | undefined)?.role;
}

/**
 * 현재 세션의 admin 유저를 반환. 미인증이거나 admin이 아니면 null.
 * 서버 컴포넌트/Route Handler 어디서든 호출 가능.
 */
export async function getAuthedAdmin(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (getRole(user) !== 'admin') return null;
  return user;
}

/**
 * 서버 컴포넌트 전용. admin이 아니면 /admin/login으로 redirect.
 */
export async function requireAdminPage(): Promise<User> {
  const user = await getAuthedAdmin();
  if (!user) redirect('/admin/login');
  return user;
}

export type AdminGuardResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

/**
 * API 라우트 전용. 통과 시 user 반환, 실패 시 401 응답.
 *
 *   const guard = await requireAdminApi();
 *   if (!guard.ok) return guard.response;
 *   const { user } = guard;
 */
export async function requireAdminApi(): Promise<AdminGuardResult> {
  const user = await getAuthedAdmin();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 }),
    };
  }
  return { ok: true, user };
}
