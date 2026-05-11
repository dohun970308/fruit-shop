'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('로그아웃에 실패했어요.', { description: error.message });
      return;
    }
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="size-4" />
      로그아웃
    </Button>
  );
}
