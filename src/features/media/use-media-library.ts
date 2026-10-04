"use client";

import { useState } from "react";
import { useAdminData } from "@/features/admin/admin-data-provider";
import { ActionError, errorMessage, unwrapAction } from "@/lib/action-result";
import type { MediaAsset } from "@/types";
import { getUploadSignatureAction, listMediaLibraryAction } from "./actions";

/** Cloudinary'nin ücretsiz planında görsel başına üst sınır. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

interface CloudinaryUploadResponse {
  public_id?: string;
  secure_url?: string;
  width?: number;
  height?: number;
  error?: { message?: string };
}

/** Cloudinary'nin (İngilizce) hata metnini avukatın anlayacağı metne çevirir. */
function uploadErrorMessage(message: string | undefined): string {
  if (!message) return "Görsel yüklenemedi. Lütfen tekrar deneyin.";
  if (/file size too large/i.test(message)) return "Dosya çok büyük; en fazla 10 MB olabilir.";
  if (/format|invalid image/i.test(message)) return "Bu dosya türü desteklenmiyor (JPG, PNG, WebP, AVIF veya HEIC yükleyin).";
  if (/signature|timestamp|api_key/i.test(message)) return "Yükleme izni alınamadı. Sayfayı yenileyip tekrar deneyin.";
  return `Görsel yüklenemedi (${message}).`;
}

/**
 * Görsel kütüphanesi (Cloudinary). Liste ilk ihtiyaçta yüklenir; yeni
 * yüklenen görsel listeye hemen eklenir.
 */
export function useMediaLibrary() {
  const { data, dispatch } = useAdminData();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load(force = false): Promise<void> {
    if (loading || (data.media && !force)) return;
    setLoading(true);
    setLoadError(null);
    try {
      dispatch({ type: "media/loaded", media: unwrapAction(await listMediaLibraryAction()) });
    } catch (error) {
      setLoadError(errorMessage(error, "Görsel kütüphanesi yüklenemedi. Lütfen tekrar deneyin."));
    } finally {
      setLoading(false);
    }
  }

  /** Dosyayı tarayıcıdan doğrudan Cloudinary'ye yükler (sunucu yalnızca imza verir). */
  async function upload(file: File): Promise<MediaAsset> {
    if (!file.type.startsWith("image/")) throw new ActionError("Lütfen bir görsel dosyası seçin.");
    if (file.size > MAX_UPLOAD_BYTES) throw new ActionError("Dosya çok büyük; en fazla 10 MB olabilir.");

    const signature = unwrapAction(await getUploadSignatureAction());
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", signature.apiKey);
    body.append("timestamp", String(signature.timestamp));
    body.append("signature", signature.signature);
    body.append("folder", signature.folder);
    body.append("allowed_formats", signature.allowedFormats);
    if (signature.uploadPreset) body.append("upload_preset", signature.uploadPreset);

    let result: CloudinaryUploadResponse;
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
        method: "POST",
        body,
      });
      result = (await response.json()) as CloudinaryUploadResponse;
      if (!response.ok) throw new ActionError(uploadErrorMessage(result.error?.message));
    } catch (error) {
      if (error instanceof ActionError) throw error;
      throw new ActionError("Görsel yüklenemedi; internet bağlantınızı kontrol edip tekrar deneyin.");
    }

    if (!result.public_id || !result.secure_url || !result.width || !result.height) {
      throw new ActionError(uploadErrorMessage(undefined));
    }
    const asset: MediaAsset = {
      id: result.public_id,
      publicId: result.public_id,
      url: result.secure_url,
      alt: "",
      width: result.width,
      height: result.height,
    };
    dispatch({ type: "media/added", asset });
    return asset;
  }

  return { media: data.media, loading, loadError, load, upload };
}
