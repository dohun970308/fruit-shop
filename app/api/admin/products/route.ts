import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { productFormSchema } from '@/lib/validators';

export const runtime = 'nodejs';

export async function POST(req: Request) {
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
    parsed = productFormSchema.parse(body);
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
    .from('products')
    .insert({
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price,
      sort_order: parsed.sortOrder,
      is_active: parsed.isActive,
      image_url: parsed.imageUrl || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[POST /api/admin/products] insert error:', error.message);
    return NextResponse.json({ error: '상품 생성에 실패했습니다.' }, { status: 500 });
  }

  revalidatePath('/');
  revalidatePath('/admin/products');

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
