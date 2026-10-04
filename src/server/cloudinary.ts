import "server-only";

import { v2 as cloudinary, type ResourceApiResponse } from "cloudinary";
import type { MediaAsset, UploadSignature } from "@/types";
import { getCloudinaryEnv, type CloudinaryEnv } from "./env";

/*
 * Cloudinary: makale görselleri. Dosya sunucuya gelmez; tarayıcı, sunucunun
 * ürettiği kısa ömürlü imzayla doğrudan Cloudinary'ye yükler (API anahtarının
 * gizli kısmı tarayıcıya hiç gitmez). Görsel kütüphanesi yükleme klasöründen
 * listelenir.
 */

/** Yüklenebilecek biçimler (imzaya dahildir; başka dosya kabul edilmez). */
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif,heic,heif";

function configure(): CloudinaryEnv {
  const env = getCloudinaryEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return env;
}

/** Tarayıcıdan imzalı yükleme için parametreler (imza yaklaşık 1 saat geçerlidir). */
export function signArticleImageUpload(): UploadSignature {
  const env = configure();
  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = {
    timestamp,
    folder: env.CLOUDINARY_ARTICLE_FOLDER,
    allowed_formats: ALLOWED_FORMATS,
  };
  if (env.CLOUDINARY_ARTICLE_UPLOAD_PRESET) params.upload_preset = env.CLOUDINARY_ARTICLE_UPLOAD_PRESET;

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature: cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET),
    folder: env.CLOUDINARY_ARTICLE_FOLDER,
    allowedFormats: ALLOWED_FORMATS,
    ...(env.CLOUDINARY_ARTICLE_UPLOAD_PRESET ? { uploadPreset: env.CLOUDINARY_ARTICLE_UPLOAD_PRESET } : {}),
  };
}

/** Görsel bu Cloudinary hesabına mı ait? (Kapak olarak yalnızca kendi hesabımızın görselleri kabul edilir.) */
export function isOwnCloudinaryImage(url: string): boolean {
  const { CLOUDINARY_CLOUD_NAME } = getCloudinaryEnv();
  return url.startsWith(`https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/`);
}

/** Cloudinary'nin tip tanımı listeyi tek elemanlı demet olarak verdiği için eleman tipi ayrıca alınır. */
type CloudinaryResource = ResourceApiResponse["resources"][number];

function toMediaAsset(resource: CloudinaryResource): MediaAsset {
  return {
    id: resource.public_id,
    publicId: resource.public_id,
    url: resource.secure_url,
    alt: "",
    width: resource.width,
    height: resource.height,
  };
}

/**
 * Cloudinary SDK'sı hatayı düz nesne olarak döndürür ve içine isteğin
 * kimlik bilgilerini (API anahtarı ve gizli anahtar) de koyar. Bu nesne
 * günlüğe yazılmamalıdır; yalnızca durum kodu ve mesajı taşıyan bir Error'a
 * çevrilir.
 */
function cloudinaryError(error: unknown): Error {
  if (error instanceof Error) return new Error(`Cloudinary isteği başarısız: ${error.message}`);
  const detail = (error as { error?: { message?: unknown; http_code?: unknown } } | null)?.error;
  return new Error(`Cloudinary isteği başarısız (${String(detail?.http_code ?? "?")}): ${String(detail?.message ?? "bilinmeyen hata")}`);
}

/**
 * Yükleme klasöründeki görseller (en yeni önce). Hesap "sabit klasör"
 * modundaysa public_id klasörle başlar; "dinamik klasör" modundaysa klasör
 * ayrı tutulur. İkisi de denenir.
 */
export async function listArticleImages(limit = 200): Promise<MediaAsset[]> {
  const env = configure();
  const folder = env.CLOUDINARY_ARTICLE_FOLDER;

  let resources: CloudinaryResource[] = (
    await cloudinary.api
      .resources({ type: "upload", resource_type: "image", prefix: `${folder}/`, max_results: limit })
      .catch((error: unknown) => {
        throw cloudinaryError(error);
      })
  ).resources;

  if (resources.length === 0) {
    try {
      resources = (await cloudinary.api.resources_by_asset_folder(folder, { max_results: limit })).resources;
    } catch {
      // Sabit klasör modundaki hesaplarda bu uç nokta yoktur.
    }
  }

  return resources
    .filter((resource) => resource.resource_type === "image")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(toMediaAsset);
}
