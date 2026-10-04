import "server-only";

import { ObjectId } from "mongodb";
import type { Article, Category, CategoryRef, ContactMessage, ImageAsset, Video } from "@/types";
import type { Collections } from "./documents";
import type {
  ArticleDocument,
  CategoryDocument,
  ContactMessageDocument,
  StoredImage,
  VideoDocument,
} from "./documents";

/*
 * Veritabanı belgeleri → uygulama tipleri. İstemciye yalnızca bu
 * dönüştürülmüş nesneler gider (ham belge, ObjectId veya Date gitmez).
 */

export type CategoryRefs = Map<string, CategoryRef>;

/** Geçerli bir 24 karakterlik kimlikse ObjectId, değilse null. */
export function parseObjectId(id: unknown): ObjectId | null {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id) ? new ObjectId(id) : null;
}

export function toImageAsset(image: StoredImage): ImageAsset {
  return {
    url: image.url,
    alt: image.alt,
    ...(image.width && image.height ? { width: image.width, height: image.height } : {}),
    ...(image.publicId ? { publicId: image.publicId } : {}),
  };
}

export function toStoredImage(image: ImageAsset): StoredImage {
  return {
    url: image.url,
    alt: image.alt.trim(),
    ...(image.publicId ? { publicId: image.publicId } : {}),
    ...(image.width && image.height ? { width: Math.round(image.width), height: Math.round(image.height) } : {}),
  };
}

export function toCategoryRef(doc: CategoryDocument): CategoryRef {
  return { id: doc._id.toHexString(), name: doc.name, slug: doc.slug };
}

export function toCategory(doc: CategoryDocument): Category {
  return {
    ...toCategoryRef(doc),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** İçeriklerdeki kategori kimliklerini ada/slug'a çevirmek için tüm kategoriler. */
export async function loadCategoryRefs(c: Collections): Promise<CategoryRefs> {
  const docs = await c.categories.find({}).toArray();
  return new Map(docs.map((doc) => [doc._id.toHexString(), toCategoryRef(doc)]));
}

function categoryOf(categoryId: ObjectId | null, refs: CategoryRefs): CategoryRef | null {
  return categoryId ? (refs.get(categoryId.toHexString()) ?? null) : null;
}

export function toArticle(doc: ArticleDocument, refs: CategoryRefs): Article {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    content: doc.content,
    coverImage: toImageAsset(doc.coverImage),
    category: categoryOf(doc.categoryId, refs),
    keywords: doc.keywords,
    readingMinutes: doc.readingMinutes,
    status: doc.status,
    publishedAt: doc.publishedAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toVideo(doc: VideoDocument, refs: CategoryRefs): Video {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    youtubeId: doc.youtubeId,
    description: doc.description,
    coverImage: toImageAsset(doc.coverImage),
    category: categoryOf(doc.categoryId, refs),
    durationSeconds: doc.durationSeconds,
    relatedArticleSlug: doc.relatedArticleSlug,
    publishedAt: doc.publishedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toContactMessage(doc: ContactMessageDocument): ContactMessage {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    subject: doc.subject,
    message: doc.message,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}
