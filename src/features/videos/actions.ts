"use server";

import { MongoServerError, ObjectId } from "mongodb";
import type { ActionResult } from "@/lib/action-result";
import { issuesToFieldErrors } from "@/lib/validation";
import { revalidatePublicSite, runAction, UserError } from "@/server/action";
import { getCollections } from "@/server/db";
import { requireAdmin } from "@/server/dal";
import type { StoredImage, VideoDocument } from "@/server/documents";
import { loadCategoryRefs, parseObjectId, toVideo } from "@/server/mappers";
import { resolveYouTubeCover } from "@/server/youtube";
import type { Video, VideoInput } from "@/types";
import { videoInputSchema } from "./schema";

/*
 * Video yazma işlemleri (Server Actions). Kapak görseli panelden gelmez:
 * video eklenirken veya YouTube ID'si değişince sunucu YouTube'daki kapağı
 * kendisi bulur (maxres → sd → hq).
 */

const VIDEO_NOT_FOUND = "Bu bağlantıya ait bir YouTube videosu bulunamadı. Linki veya video ID'sini kontrol edin.";

export async function saveVideoAction(input: VideoInput, id?: string): Promise<ActionResult<Video>> {
  return runAction(async () => {
    await requireAdmin();

    const parsed = videoInputSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = issuesToFieldErrors(parsed.error.issues);
      // Formdaki alan adı "youtube"tır.
      if (fieldErrors.youtubeId) fieldErrors.youtube = fieldErrors.youtubeId;
      throw new UserError("Lütfen işaretli alanları kontrol edin.", fieldErrors);
    }
    const data = parsed.data;
    const c = await getCollections();

    const objectId = id ? parseObjectId(id) : null;
    const existing = objectId ? await c.videos.findOne({ _id: objectId }) : null;
    if (id && !existing) throw new UserError("Video bulunamadı; silinmiş olabilir.");

    const duplicate = await c.videos.findOne({
      youtubeId: data.youtubeId,
      ...(existing ? { _id: { $ne: existing._id } } : {}),
    });
    if (duplicate) {
      const message = `Bu YouTube videosu zaten eklenmiş: “${duplicate.title}”`;
      throw new UserError(message, { youtube: message });
    }

    let categoryId: ObjectId | null = null;
    if (data.categoryId) {
      categoryId = parseObjectId(data.categoryId);
      if (!categoryId || (await c.categories.countDocuments({ _id: categoryId }, { limit: 1 })) === 0) {
        throw new UserError("Seçilen kategori bulunamadı; silinmiş olabilir.", { categoryId: "Kategori bulunamadı" });
      }
    }

    if (
      data.relatedArticleSlug &&
      (await c.articles.countDocuments({ slug: data.relatedArticleSlug, status: "published" }, { limit: 1 })) === 0
    ) {
      throw new UserError("Seçilen ilgili makale bulunamadı veya yayında değil.", {
        relatedArticleSlug: "Makale bulunamadı",
      });
    }

    let coverImage: StoredImage;
    if (!existing || existing.youtubeId !== data.youtubeId) {
      const cover = await resolveYouTubeCover(data.youtubeId, data.title);
      if (cover.status === "not-found") throw new UserError(VIDEO_NOT_FOUND, { youtube: VIDEO_NOT_FOUND });
      coverImage = cover.cover;
    } else {
      coverImage = { ...existing.coverImage, alt: data.title };
    }

    const now = new Date();
    const fields = {
      title: data.title,
      youtubeId: data.youtubeId,
      description: data.description,
      coverImage,
      categoryId,
      durationSeconds: data.durationSeconds,
      relatedArticleSlug: data.relatedArticleSlug,
      updatedAt: now,
    } satisfies Partial<VideoDocument>;

    let saved: VideoDocument;
    try {
      if (existing) {
        await c.videos.updateOne({ _id: existing._id }, { $set: fields });
        saved = { ...existing, ...fields };
      } else {
        saved = { _id: new ObjectId(), ...fields, publishedAt: now, createdAt: now };
        await c.videos.insertOne(saved);
      }
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new UserError("Bu YouTube videosu zaten eklenmiş.", { youtube: "Bu YouTube videosu zaten eklenmiş" });
      }
      throw error;
    }

    revalidatePublicSite();
    return toVideo(saved, await loadCategoryRefs(c));
  });
}

export async function deleteVideoAction(id: string): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireAdmin();
    const objectId = parseObjectId(id);
    const c = await getCollections();
    const result = objectId ? await c.videos.deleteOne({ _id: objectId }) : null;
    if (!result?.deletedCount) throw new UserError("Video bulunamadı; zaten silinmiş olabilir.");
    revalidatePublicSite();
    return { id };
  });
}
