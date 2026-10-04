"use server";

import { MongoServerError, ObjectId } from "mongodb";
import type { ActionResult } from "@/lib/action-result";
import { normalizeArticleContent } from "@/lib/article-content.server";
import { issuesToFieldErrors } from "@/lib/validation";
import { revalidatePublicSite, runAction, UserError } from "@/server/action";
import { isOwnCloudinaryImage } from "@/server/cloudinary";
import { getCollections } from "@/server/db";
import { requireAdmin } from "@/server/dal";
import type { ArticleDocument } from "@/server/documents";
import { loadCategoryRefs, parseObjectId, toArticle, toStoredImage } from "@/server/mappers";
import type { Article, ArticleInput } from "@/types";
import { articleFormSchema } from "./schema";

/*
 * Makale yazma işlemleri (Server Actions). Her işlem oturumu kendisi
 * doğrular ve girdiyi sunucuda yeniden doğrular; istemcideki kontroller
 * yalnızca kullanıcı deneyimi içindir.
 */

const SLUG_TAKEN = "Bu adres başka bir makalede kullanılıyor";

function isDuplicateKey(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === 11000;
}

export async function saveArticleAction(input: ArticleInput, id?: string): Promise<ActionResult<Article>> {
  return runAction(async () => {
    await requireAdmin();

    const parsed = articleFormSchema.safeParse(input);
    if (!parsed.success) {
      throw new UserError("Lütfen işaretli alanları kontrol edin.", issuesToFieldErrors(parsed.error.issues));
    }
    const data = parsed.data;
    const c = await getCollections();

    const objectId = id ? parseObjectId(id) : null;
    const existing = objectId ? await c.articles.findOne({ _id: objectId }) : null;
    if (id && !existing) throw new UserError("Makale bulunamadı; silinmiş olabilir.");

    let categoryId: ObjectId | null = null;
    if (data.categoryId) {
      categoryId = parseObjectId(data.categoryId);
      if (!categoryId || (await c.categories.countDocuments({ _id: categoryId }, { limit: 1 })) === 0) {
        throw new UserError("Seçilen kategori bulunamadı; silinmiş olabilir.", { categoryId: "Kategori bulunamadı" });
      }
    }

    const others = existing ? { _id: { $ne: existing._id } } : {};
    const slugInUse = await c.articles.findOne(
      { ...others, $or: [{ slug: data.slug }, { previousSlugs: data.slug }] },
      { projection: { _id: 1 } },
    );
    if (slugInUse) throw new UserError(`${SLUG_TAKEN}.`, { slug: SLUG_TAKEN });

    const coverImage = toStoredImage(data.coverImage);
    if (coverImage.url && coverImage.url !== existing?.coverImage.url && !isOwnCloudinaryImage(coverImage.url)) {
      throw new UserError("Kapak görseli kütüphaneden seçilmeli veya bilgisayardan yüklenmelidir.", {
        "coverImage.url": "Geçersiz görsel",
      });
    }

    const now = new Date();
    // Yayındaki makalenin adresi değişirse eski adres yeni adrese yönlenir.
    const previousSlugs = new Set((existing?.previousSlugs ?? []).filter((slug) => slug !== data.slug));
    if (existing?.status === "published" && existing.slug !== data.slug) previousSlugs.add(existing.slug);

    const fields = {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      content: normalizeArticleContent(data.content),
      coverImage,
      categoryId,
      keywords: [...new Map(data.keywords.map((keyword) => [keyword.toLocaleLowerCase("tr"), keyword])).values()],
      readingMinutes: data.readingMinutes,
      status: data.status,
      publishedAt: data.status === "published" ? (existing?.publishedAt ?? now) : null,
      previousSlugs: [...previousSlugs],
      updatedAt: now,
    } satisfies Partial<ArticleDocument>;

    let saved: ArticleDocument;
    try {
      if (existing) {
        await c.articles.updateOne({ _id: existing._id }, { $set: fields });
        saved = { ...existing, ...fields };
        // Videolardaki "ilgili makale" bağlantıları yeni adrese taşınır.
        if (existing.slug !== data.slug) {
          await c.videos.updateMany({ relatedArticleSlug: existing.slug }, { $set: { relatedArticleSlug: data.slug } });
        }
      } else {
        saved = { _id: new ObjectId(), ...fields, createdAt: now };
        await c.articles.insertOne(saved);
      }
    } catch (error) {
      if (isDuplicateKey(error)) throw new UserError(`${SLUG_TAKEN}.`, { slug: SLUG_TAKEN });
      throw error;
    }

    revalidatePublicSite();
    return toArticle(saved, await loadCategoryRefs(c));
  });
}

export async function deleteArticleAction(id: string): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireAdmin();
    const objectId = parseObjectId(id);
    const c = await getCollections();
    const deleted = objectId ? await c.articles.findOneAndDelete({ _id: objectId }) : null;
    if (!deleted) throw new UserError("Makale bulunamadı; zaten silinmiş olabilir.");

    // Bu makaleye bağlanan videolarda bağlantı kaldırılır (silinen sayfaya yönlendirmesin).
    await c.videos.updateMany({ relatedArticleSlug: deleted.slug }, { $set: { relatedArticleSlug: null } });
    revalidatePublicSite();
    return { id };
  });
}
