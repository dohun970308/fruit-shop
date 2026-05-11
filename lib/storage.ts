import 'server-only';

export const PRODUCT_IMAGE_BUCKET = 'product-images';

/**
 * Supabase Storage public URL에서 버킷 내부 경로 추출.
 * 형식: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 * 다른 형식이거나 다른 버킷이면 null.
 */
export function extractProductImagePath(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const prefix = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  if (!parsed.pathname.startsWith(prefix)) return null;
  const path = parsed.pathname.slice(prefix.length);
  return path || null;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export function isAllowedImageMime(mime: string): boolean {
  return mime in MIME_TO_EXT;
}

export function pickImageExtension(file: { name?: string; type: string }): string {
  // 1) 파일명 확장자 우선
  const nameExt = file.name?.split('.').pop()?.toLowerCase();
  if (nameExt && /^[a-z0-9]{1,5}$/.test(nameExt)) return nameExt === 'jpeg' ? 'jpg' : nameExt;
  // 2) MIME에서 추론
  return MIME_TO_EXT[file.type] ?? 'bin';
}
