import type { Collection, Db, ObjectId } from "mongodb";
import type { ArticleStatus, ContactMessageStatus } from "@/types";

/*
 * MongoDB koleksiyonları ve belge şemaları.
 *
 * Yeni site eski API'nin koleksiyonlarını (makalelerim, kategoriler,
 * videolarim, iletisim) doğrudan kullanmaz; temiz şemalı kendi
 * koleksiyonlarını kullanır. Eski veriler `pnpm db:migrate-legacy` ile
 * aktarılır ve canlıya geçişe kadar eşitlenebilir (eski koleksiyonlar
 * değiştirilmez). Aktarılan kayıtlar `legacyId` alanında eski belgenin
 * kimliğini, `legacyUpdatedAt` alanında son eşitlenen sürümünü taşır; betiğin
 * kendi kayıtları `legacy_imports` koleksiyonundadır.
 *
 * Not: Bu dosya "server-only" içe aktarmaz (gizli bilgi ve bağlantı
 * içermez); böylece aktarma betiği (scripts/migrate-legacy.ts) de aynı
 * tanımları kullanır.
 */

export const COLLECTIONS = {
  articles: "articles",
  categories: "categories",
  videos: "videos",
  contactMessages: "contact_messages",
  adminSessions: "admin_sessions",
  rateLimits: "rate_limits",
} as const;

/** Kaydedilen görsel: Cloudinary (makale) veya YouTube (video kapağı). */
export interface StoredImage {
  url: string;
  alt: string;
  /** Cloudinary public_id (silme/yönetim için); YouTube kapaklarında yok. */
  publicId?: string;
  width?: number;
  height?: number;
}

export interface ArticleDocument {
  _id: ObjectId;
  title: string;
  slug: string;
  summary: string;
  /** Temizlenmiş HTML (bkz. src/lib/article-content.ts). */
  content: string;
  coverImage: StoredImage;
  categoryId: ObjectId | null;
  keywords: string[];
  readingMinutes: number;
  status: ArticleStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Yayındayken değiştirilen eski adresler; eski bağlantılar yeni adrese kalıcı (308) yönlenir. */
  previousSlugs?: string[];
  legacyId?: ObjectId;
  /** Eski kaydın son aktarılan sürümü; updatedAt bundan farklıysa kayıt yeni panelde düzenlenmiştir. */
  legacyUpdatedAt?: Date;
}

export interface CategoryDocument {
  _id: ObjectId;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  legacyId?: ObjectId;
  legacyUpdatedAt?: Date;
}

export interface VideoDocument {
  _id: ObjectId;
  title: string;
  youtubeId: string;
  description: string;
  coverImage: StoredImage;
  categoryId: ObjectId | null;
  durationSeconds: number | null;
  relatedArticleSlug: string | null;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  legacyId?: ObjectId;
  legacyUpdatedAt?: Date;
}

export interface ContactMessageDocument {
  _id: ObjectId;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date;
  legacyId?: ObjectId;
}

export interface AdminSessionDocument {
  _id: ObjectId;
  /** Çerezdeki rastgele anahtarın SHA-256 özeti (anahtarın kendisi saklanmaz). */
  tokenHash: string;
  /** Oturum açıldığındaki giriş bilgilerinin parmak izi; şifre değişince oturum geçersiz olur. */
  credential: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent: string | null;
}

export interface RateLimitDocument {
  /** Ör. "login:203.0.113.5" */
  _id: string;
  count: number;
  expiresAt: Date;
}

export interface Collections {
  articles: Collection<ArticleDocument>;
  categories: Collection<CategoryDocument>;
  videos: Collection<VideoDocument>;
  contactMessages: Collection<ContactMessageDocument>;
  adminSessions: Collection<AdminSessionDocument>;
  rateLimits: Collection<RateLimitDocument>;
}

export function collections(db: Db): Collections {
  return {
    articles: db.collection<ArticleDocument>(COLLECTIONS.articles),
    categories: db.collection<CategoryDocument>(COLLECTIONS.categories),
    videos: db.collection<VideoDocument>(COLLECTIONS.videos),
    contactMessages: db.collection<ContactMessageDocument>(COLLECTIONS.contactMessages),
    adminSessions: db.collection<AdminSessionDocument>(COLLECTIONS.adminSessions),
    rateLimits: db.collection<RateLimitDocument>(COLLECTIONS.rateLimits),
  };
}

const TURKISH_CASE_INSENSITIVE = { locale: "tr", strength: 2 } as const;
const LEGACY_ONLY = { legacyId: { $exists: true } };

/** Koleksiyon indeksleri (süreç başına bir kez; var olan indekslerde işlem yapılmaz). */
export async function ensureIndexes(db: Db): Promise<void> {
  const c = collections(db);
  await Promise.all([
    c.articles.createIndexes([
      { key: { slug: 1 }, name: "slug_unique", unique: true },
      { key: { previousSlugs: 1 }, name: "previousSlugs", sparse: true },
      { key: { status: 1, publishedAt: -1 }, name: "status_publishedAt" },
      { key: { categoryId: 1 }, name: "categoryId" },
      { key: { "coverImage.publicId": 1 }, name: "coverImage_publicId", sparse: true },
      { key: { legacyId: 1 }, name: "legacyId_unique", unique: true, partialFilterExpression: LEGACY_ONLY },
    ]),
    c.categories.createIndexes([
      { key: { slug: 1 }, name: "slug_unique", unique: true },
      { key: { name: 1 }, name: "name_unique_tr", unique: true, collation: TURKISH_CASE_INSENSITIVE },
      { key: { legacyId: 1 }, name: "legacyId_unique", unique: true, partialFilterExpression: LEGACY_ONLY },
    ]),
    c.videos.createIndexes([
      { key: { youtubeId: 1 }, name: "youtubeId_unique", unique: true },
      { key: { publishedAt: -1 }, name: "publishedAt" },
      { key: { categoryId: 1 }, name: "categoryId" },
      { key: { legacyId: 1 }, name: "legacyId_unique", unique: true, partialFilterExpression: LEGACY_ONLY },
    ]),
    c.contactMessages.createIndexes([
      { key: { createdAt: -1 }, name: "createdAt" },
      { key: { legacyId: 1 }, name: "legacyId_unique", unique: true, partialFilterExpression: LEGACY_ONLY },
    ]),
    c.adminSessions.createIndexes([
      { key: { tokenHash: 1 }, name: "tokenHash_unique", unique: true },
      // Süresi dolan oturumları MongoDB kendisi siler.
      { key: { expiresAt: 1 }, name: "expiresAt_ttl", expireAfterSeconds: 0 },
    ]),
    c.rateLimits.createIndexes([{ key: { expiresAt: 1 }, name: "expiresAt_ttl", expireAfterSeconds: 0 }]),
  ]);
}
