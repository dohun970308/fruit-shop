import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const patchSchema = z.object({
  status: z.enum(['RECEIVED', 'DELIVERED']),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = patchSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: '입력값을 확인해 주세요.', issues: err.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: '입력값을 확인해 주세요.' }, { status: 422 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('orders')
    .update({ status: parsed.status, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id, status')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }
    console.error('[PATCH /api/admin/orders/[id]] update error:', error.message);
    return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const supabase = createServiceClient();
  // order_items는 ON DELETE CASCADE로 자동 정리됨.
  const { error, count } = await supabase
    .from('orders')
    .delete({ count: 'exact' })
    .eq('id', params.id);

  if (error) {
    console.error('[DELETE /api/admin/orders/[id]] error:', error.message);
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
  }

  if (count === 0) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
