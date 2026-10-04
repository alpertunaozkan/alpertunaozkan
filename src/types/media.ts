/** Paneldeki görsel kütüphanesi öğesi (Cloudinary'deki yükleme klasöründen). */
export interface MediaAsset {
  id: string;
  /** Cloudinary public_id. */
  publicId: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

/** Tarayıcıdan Cloudinary'ye imzalı yükleme için sunucunun verdiği parametreler. */
export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  uploadPreset?: string;
}
