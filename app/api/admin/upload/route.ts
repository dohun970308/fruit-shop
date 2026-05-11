import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import {
  PRODUCT_IMAGE_BUCKET,
  isAllowedImageMime,
  pickImageExtension,
} from '@/lib/storage';

export const runtime = 'nodejs';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const raw = form.get('file');
  if (!(raw instanceof File)) {
    return NextResponse.json({ error: '파일이 첨부되지 않았습니다.' }, { status: 400 });
  }
  const file = raw;

  if (file.size === 0) {
    return NextResponse.json({ error: '빈 파일은 업로드할 수 없습니다.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: '파일 크기는 5MB 이하만 허용됩니다.' },
      { status: 413 },
    );
  }
  if (!file.type.startsWith('image/') || !isAllowedImageMime(file.type)) {
    return NextResponse.json(
      { error: 'jpg/png/webp/gif/avif 이미지만 업로드할 수 있습니다.' },
      { status: 415 },
    );
  }

  const ext = pickImageExtension({ name: file.name, type: file.type });
  const filename = `${crypto.randomUUID()}.${ext}`;

  const supabase = createServiceClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(filename, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    console.error('[POST /api/admin/upload] storage upload error:', uploadErr.message);
    return NextResponse.json({ error: '이미지 업로드에 실패했습니다.' }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(filename);

  return NextResponse.json({ url: publicData.publicUrl, path: filename }, { status: 201 });
}
