"use server";

import type { ActionResult } from "@/lib/action-result";
import { runAction } from "@/server/action";
import { listArticleImages, signArticleImageUpload } from "@/server/cloudinary";
import { requireAdmin } from "@/server/dal";
import type { MediaAsset, UploadSignature } from "@/types";

/** Tarayıcının görseli doğrudan Cloudinary'ye yükleyebilmesi için kısa ömürlü imza. */
export async function getUploadSignatureAction(): Promise<ActionResult<UploadSignature>> {
  return runAction(async () => {
    await requireAdmin();
    return signArticleImageUpload();
  });
}

/** Görsel kütüphanesi: Cloudinary'deki makale görselleri klasörü. */
export async function listMediaLibraryAction(): Promise<ActionResult<MediaAsset[]>> {
  return runAction(async () => {
    await requireAdmin();
    return listArticleImages();
  });
}
