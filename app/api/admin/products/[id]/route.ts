import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { productFormSchema } from '@/lib/validators';
import { PRODUCT_IMAGE_BUCKET, extractProductImagePath } from '@/lib/storage';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: '잘못된 상품 ID입니다.' }, { status: 400 });
  }

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

  // 기존 image_url 확보 (변경 시 storage 정리용)
  const { data: existing, error: existingErr } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', params.id)
    .maybeSingle();

  if (existingErr) {
    console.error('[PATCH /api/admin/products] select error:', existingErr.message);
    return NextResponse.json({ error: '상품 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
  }

  const nextImageUrl = parsed.imageUrl || null;
  const { error: updateErr } = await supabase
    .from('products')
    .update({
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price,
      sort_order: parsed.sortOrder,
      is_active: parsed.isActive,
      image_url: nextImageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id);

  if (updateErr) {
    console.error('[PATCH /api/admin/products] update error:', updateErr.message);
    return NextResponse.json({ error: '상품 수정에 실패했습니다.' }, { status: 500 });
  }

  // 이미지가 바뀌었고, 기존 파일이 우리 버킷에 있다면 정리 (실패해도 200 응답)
  const oldPath = extractProductImagePath(existing.image_url);
  if (oldPath && existing.image_url !== nextImageUrl) {
    const { error: removeErr } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .remove([oldPath]);
    if (removeErr) {
      console.error('[PATCH /api/admin/products] storage cleanup warn:', removeErr.message);
    }
  }

  revalidatePath('/');
  revalidatePath(`/products/${params.id}`);
  revalidatePath('/admin/products');

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: '잘못된 상품 ID입니다.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: existing, error: existingErr } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', params.id)
    .maybeSingle();

  if (existingErr) {
    console.error('[DELETE /api/admin/products] select error:', existingErr.message);
    return NextResponse.json({ error: '상품 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
  }

  // order_items.product_id는 ON DELETE SET NULL이라 과거 주문은 안전.
  const { error: delErr } = await supabase.from('products').delete().eq('id', params.id);
  if (delErr) {
    console.error('[DELETE /api/admin/products] delete error:', delErr.message);
    return NextResponse.json({ error: '상품 삭제에 실패했습니다.' }, { status: 500 });
  }

  const oldPath = extractProductImagePath(existing.image_url);
  if (oldPath) {
    const { error: removeErr } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .remove([oldPath]);
    if (removeErr) {
      console.error('[DELETE /api/admin/products] storage cleanup warn:', removeErr.message);
    }
  }

  revalidatePath('/');
  revalidatePath(`/products/${params.id}`);
  revalidatePath('/admin/products');

  return NextResponse.json({ ok: true });
}
