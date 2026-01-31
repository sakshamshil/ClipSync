import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = 'images';

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Image must be smaller than 5MB' };
  }
  return { valid: true };
}

export async function uploadImage(
  file: File,
  roomCode: string
): Promise<{ url: string; error?: string }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { url: '', error: validation.error };
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const extension = file.name.split('.').pop() || 'png';
  const path = `${roomCode}/${timestamp}-${random}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file);

  if (uploadError) {
    return { url: '', error: 'Failed to upload image' };
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function deleteImage(url: string): Promise<{ error?: string }> {
  // Extract path from public URL
  const pathMatch = url.match(/\/storage\/v1\/object\/public\/images\/(.+)$/);
  if (!pathMatch) {
    return { error: 'Invalid image URL' };
  }

  const path = pathMatch[1];
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    return { error: 'Failed to delete image' };
  }

  return {};
}

export async function deleteRoomImages(roomCode: string): Promise<{ error?: string }> {
  // List all files in the room folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(roomCode);

  if (listError) {
    return { error: 'Failed to list images' };
  }

  if (!files || files.length === 0) {
    return {};
  }

  // Delete all files in the room
  const paths = files.map((file) => `${roomCode}/${file.name}`);
  const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove(paths);

  if (deleteError) {
    return { error: 'Failed to delete some images' };
  }

  return {};
}
