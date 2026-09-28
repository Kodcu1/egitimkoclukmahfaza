import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../lib/db';

export interface AvatarValidationResult {
  isValid: boolean;
  error?: string;
  mimeType?: string;
}

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates file size and inspects actual magic bytes to verify real image type.
 */
export async function validateAvatarFile(file: File): Promise<AvatarValidationResult> {
  // 1. Check size limit
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'Fotoğraf boyutu 5 MB sınırını aşamaz. Lütfen daha küçük bir dosya seçin.',
    };
  }

  // 2. Initial browser MIME type check
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Yalnızca JPG, JPEG, PNG veya WebP formatında görsel yükleyebilirsiniz.',
    };
  }

  // 3. Deep magic bytes verification
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;

    // Check JPEG signature: FF D8 FF
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

    // Check WebP signature: "RIFF" .... "WEBP"
    const isRiff =
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const isWebp =
      isRiff &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;

    if (!isPng && !isJpg && !isWebp) {
      return {
        isValid: false,
        error: 'Dosya içeriği geçerli bir görsel formatı (JPG, PNG veya WebP) değil.',
      };
    }

    const detectedMime = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
    return { isValid: true, mimeType: detectedMime };
  } catch (err) {
    // If reading slice fails, rely on browser MIME if in allowed list
    return { isValid: true, mimeType: file.type };
  }
}

/**
 * Uploads an avatar image for a user.
 * Tries Supabase Storage 'profile-avatars' first.
 * If storage bucket is not available, falls back to server endpoint /api/upload/avatar.
 */
export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  const validation = await validateAvatarFile(file);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  // Derive safe extension
  const ext = validation.mimeType === 'image/png' ? 'png' : validation.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const timestamp = Date.now();
  const safeRandom = Math.random().toString(36).substring(2, 9);
  const safeStoragePath = `${userId}/${timestamp}_${safeRandom}.${ext}`;

  // 1. Try Supabase Storage first
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(safeStoragePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: validation.mimeType,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('profile-avatars')
          .getPublicUrl(safeStoragePath);

        const avatarUrl = publicUrlData.publicUrl;

        // Persist to profiles and students
        await persistAvatar(userId, avatarUrl);

        return { success: true, avatarUrl };
      }
    } catch (sbErr) {
      console.warn('Supabase storage direct upload notice, falling back to server:', sbErr);
    }
  }

  // 2. Fallback: Upload via server endpoint
  try {
    const base64 = await fileToBase64(file);
    const response = await fetch('/api/upload/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        fileData: base64,
        mimeType: validation.mimeType,
        fileName: `avatar_${timestamp}.${ext}`,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const avatarUrl = data.avatarUrl;
      await persistAvatar(userId, avatarUrl);
      return { success: true, avatarUrl };
    } else {
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Yükleme başarısız oldu.' };
    }
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return { success: false, error: 'Fotoğraf sunucuya iletilemedi. Lütfen tekrar deneyin.' };
  }
}

/**
 * Removes avatar for a user.
 */
export async function removeUserAvatar(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await persistAvatar(userId, null);
    await fetch('/api/upload/avatar/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {});

    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'Profil fotoğrafı kaldırılamadı.' };
  }
}

async function persistAvatar(userId: string, avatarUrl: string | null) {
  // Update in client db
  const allStudents = await db.getStudents();
  const stu = allStudents.find((s) => s.id === userId || s.user_id === userId);
  if (stu) {
    await db.updateStudent(stu.id, { avatar_url: avatarUrl || undefined });
  }

  await db.updateProfile(userId, { avatar_url: avatarUrl || undefined });

  // Dispatches
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('students_updated'));
    window.dispatchEvent(new CustomEvent('profiles_updated'));
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Dosya okunamadı'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
