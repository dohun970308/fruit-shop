import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미들웨어가 1차 차단하지만 안전망. 사용자/역할이 비었으면 로그인으로.
  if (!user || (user.app_metadata as { role?: string } | undefined)?.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
        <div className="border-b border-stone-200 px-4 py-4">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            <span className="text-xl" aria-hidden>
              🍊
            </span>
            <span>관리자</span>
          </Link>
        </div>
        <AdminSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4 md:px-6">
          <Link href="/admin" className="font-semibold md:hidden">
            🍊 관리자
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-stone-600 sm:inline">{user.email}</span>
            <LogoutButton />
          </div>
        </header>

        <div className="md:hidden border-b border-stone-200 bg-white">
          <AdminSidebar />
        </div>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
