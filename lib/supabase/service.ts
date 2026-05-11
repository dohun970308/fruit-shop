import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * service_role 키를 사용하는 Supabase 클라이언트. RLS를 우회하므로 서버에서만 사용.
 * 절대 클라이언트 번들에 포함되면 안 됨.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
