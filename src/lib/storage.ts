import { supabase } from './supabase';

const BUCKET = 'product-images';
const MAX_FILE_SIZE_MB = 2;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Format file harus JPG, PNG, WEBP, atau GIF';
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Ukuran file maksimal ${MAX_FILE_SIZE_MB}MB`;
  }
  return null;
}

/** Uploads a product photo picked from the device and returns its public URL. */
export async function uploadProductImage(file: File): Promise<string> {
  const invalidReason = validateImageFile(file);
  if (invalidReason) throw new Error(invalidReason);

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`Gagal mengunggah foto: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Best-effort cleanup of a previously uploaded product photo. Never throws. */
export async function deleteProductImage(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return; // not one of our uploaded images (e.g. external URL)
  const path = url.slice(idx + marker.length);
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // non-fatal — an orphaned file is harmless
  }
}
