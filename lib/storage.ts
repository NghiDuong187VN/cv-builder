import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export type UploadAvatarArgs = {
  uid: string;
  cvId: string;
  file: File;
};

function inferExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase() || '';
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const fromType = (file.type || '').split('/')[1]?.toLowerCase() || '';
  if (fromType && /^[a-z0-9]+$/.test(fromType)) return fromType;
  return 'jpg';
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể đọc ảnh'));
    };
    img.src = url;
  });
}

async function optimizeAvatarImage(file: File): Promise<File> {
  // Keep small files untouched to preserve quality.
  if (file.size <= 4 * 1024 * 1024) return file;

  const img = await loadImageFromFile(file);
  const maxSide = 1600;
  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, w, h);

  const qualities = [0.9, 0.82, 0.74, 0.66];
  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) continue;
    if (blob.size <= 4 * 1024 * 1024 || quality === qualities[qualities.length - 1]) {
      const nextName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
      return new File([blob], `${nextName}.jpg`, { type: 'image/jpeg' });
    }
  }

  return file;
}

export async function uploadAvatar({ uid, cvId, file }: UploadAvatarArgs): Promise<{ url: string; path: string }> {
  const prepared = await optimizeAvatarImage(file);
  const ext = inferExtension(prepared);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `avatars/${uid}/${cvId}/${filename}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, prepared, {
    contentType: prepared.type || undefined,
    cacheControl: 'public,max-age=31536000',
  });

  const url = await getDownloadURL(storageRef);
  return { url, path };
}

