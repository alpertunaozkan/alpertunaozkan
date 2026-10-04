/*
 * Eski API'nin verilerini yeni sitenin koleksiyonlarına aktarır ve eşitler.
 *
 *   pnpm db:migrate-legacy --dry-run   → yalnızca rapor; hiçbir şey yazılmaz
 *   pnpm db:migrate-legacy             → aktarır / eşitler
 *   pnpm db:migrate-legacy --prune     → eski sistemde silinen kayıtları yeni siteden de kaldırır
 *
 * Kaynak: eski API'nin koleksiyonları (kategoriler, makalelerim, videolarim,
 * iletisim). Bunlar yalnızca OKUNUR; hiçbiri değiştirilmez veya silinmez, eski
 * site aktarımdan etkilenmez.
 *
 * Betik canlıya geçişe kadar istendiği kadar çalıştırılabilir:
 * - Eski sistemde yeni eklenen kayıt eklenir.
 * - Eski sistemde değiştirilen kayıt, yeni panelde düzenlenmemişse güncellenir;
 *   iki tarafta da değiştirilmişse yeni sitedeki hâli korunur ve raporda belirtilir.
 * - Eski sistemde silinen kayıt raporda listelenir; --prune ile (yeni panelde
 *   düzenlenmemişse) yeni siteden de silinir.
 * - Yeni panelde silinen kayıt bir daha aktarılmaz.
 * Yeni panelde yapılan değişikliklerin üzerine hiçbir durumda yazılmaz. Hangi
 * eski kaydın hangi yeni kayda aktarıldığı `legacy_imports` koleksiyonunda
 * tutulur (yalnızca bu betik kullanır; geçiş tamamlanınca silinebilir).
 *
 * Ortam değişkenleri kabuktan, yoksa .env.local ve .env dosyalarından okunur:
 * - MONGODB_URI (+ MONGODB_DB): hedef, yani yeni sitenin veritabanı.
 * - LEGACY_MONGODB_URI / LEGACY_MONGODB_DB (isteğe bağlı): eski veriler başka
 *   bir kümede/veritabanındaysa. Tanımlı değilse eski API gibi MONGODB_URI
 *   adresindeki veritabanı okunur.
 * - CLOUDINARY_* (isteğe bağlı): makale görsellerinin asıl adresi ve gerçek
 *   boyutları Cloudinary'den alınır. Yoksa boyut boş kalır ve site görseli
 *   tarayıcıda ölçerek gösterir; anahtarlar sonradan eklenirse bir sonraki
 *   çalıştırmada eksik boyutlar tamamlanır.
 */

import { existsSync } from "node:fs";
import { v2 as cloudinary } from "cloudinary";
import { DOMParser } from "linkedom";
import { MongoClient, ObjectId, type Collection, type Db } from "mongodb";
import { SLUG_PATTERN } from "../src/features/articles/schema";
import { normalizeArticleHtml, type HtmlParser } from "../src/lib/article-content";
import { slugify, uniqueSlug } from "../src/lib/slugify";
import { estimateReadingMinutes, stripHtml, truncate } from "../src/lib/text";
import { parseYouTubeId } from "../src/lib/youtube";
import {
  collections,
  ensureIndexes,
  type ArticleDocument,
  type CategoryDocument,
  type Collections,
  type ContactMessageDocument,
  type StoredImage,
  type VideoDocument,
} from "../src/server/documents";
import { resolveYouTubeCover } from "../src/server/youtube";

// Ortam: kabuktaki değerler önceliklidir; .env.local, .env'den önce gelir (Next.js ile aynı sıra).
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

/** Eski API'nin koleksiyon adları. */
const LEGACY = {
  categories: "kategoriler",
  articles: "makalelerim",
  videos: "videolarim",
  contacts: "iletisim",
} as const;
type Kind = keyof typeof LEGACY;

const IMPORTS_COLLECTION = "legacy_imports";

const options = new Set(process.argv.slice(2));
const dryRun = options.has("--dry-run");
const prune = options.has("--prune");

/* ---------------------------------------------------------------- */
/*  Eski belgeler (Mongoose şemalarından; alanlar savunmacı okunur)  */
/* ---------------------------------------------------------------- */

interface LegacyBase {
  _id: ObjectId;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface LegacyCategory extends LegacyBase {
  name?: unknown;
}

interface LegacyArticle extends LegacyBase {
  title?: unknown;
  slug?: unknown;
  content?: unknown;
  image?: { url?: unknown; alt?: unknown; publicId?: unknown };
  summary?: unknown;
  category?: unknown;
  keywords?: unknown;
  readingMinutes?: unknown;
}

interface LegacyVideo extends LegacyBase {
  title?: unknown;
  youtubeId?: unknown;
  category?: unknown;
}

interface LegacyContact extends LegacyBase {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  title?: unknown;
  content?: unknown;
}

/** Aktarım kaydı: hangi eski belge hangi yeni belgeye aktarıldı. */
interface ImportMarker {
  _id: string;
  kind: Kind;
  legacyId: ObjectId;
  targetId: ObjectId;
  /** Yeni panelde önceden açılmış aynı adlı kategoriye bağlandı (betik bu kayda hiç dokunmaz). */
  linked?: boolean;
  importedAt: Date;
}

/* ---------------------------------------------------------------- */
/*  Yardımcılar                                                     */
/* ---------------------------------------------------------------- */

const parser = new DOMParser() as unknown as HtmlParser;
const warnings: string[] = [];

interface Tally {
  legacy: number;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  /** Yeni panelde silinmiş (bir daha aktarılmaz). */
  deletedHere: number;
  /** Eski sistemde silinmiş, yeni sitede duran kayıtlar. */
  deletedThere: number;
  removed: number;
  /** Boyutu Cloudinary'den sonradan tamamlanan kapaklar. */
  completed: number;
}

const tally = (): Tally => ({
  legacy: 0,
  inserted: 0,
  updated: 0,
  unchanged: 0,
  skipped: 0,
  deletedHere: 0,
  deletedThere: 0,
  removed: 0,
  completed: 0,
});

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

/** Tek satırlık metin: boşluklar sadeleştirilir; metin değilse "". */
function line(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function date(value: unknown, fallback: Date): Date {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : fallback;
}

function objectId(value: unknown): ObjectId | null {
  if (value instanceof ObjectId) return value;
  return typeof value === "string" && ObjectId.isValid(value) && value.length === 24 ? new ObjectId(value) : null;
}

const quote = (value: string) => `“${truncate(value, 60)}”`;
const hex = (id: ObjectId) => id.toHexString();

function createdAtOf(doc: LegacyBase): Date {
  return date(doc.createdAt, doc._id.getTimestamp());
}

function updatedAtOf(doc: LegacyBase): Date {
  return date(doc.updatedAt, createdAtOf(doc));
}

interface Syncable {
  updatedAt: Date;
  legacyUpdatedAt?: Date;
}

/** Kayıt, son aktarımdan sonra yeni panelde değiştirilmiş mi? */
function editedHere(doc: Syncable): boolean {
  return !doc.legacyUpdatedAt || doc.updatedAt.getTime() !== doc.legacyUpdatedAt.getTime();
}

/** Eski kayıt, son aktarımdan sonra eski sistemde değiştirilmiş mi? */
function changedThere(doc: Syncable, legacyUpdatedAt: Date): boolean {
  return doc.legacyUpdatedAt?.getTime() !== legacyUpdatedAt.getTime();
}

function deletedThereWarning(label: string): string {
  return `${label}: eski sistemde silinmiş; yeni sitede duruyor${prune ? " (yeni panelde değiştirildiği için korundu)" : " (kaldırmak için --prune)"}.`;
}

/** Aktarım kayıtları (her içerik türü için ayrı). Deneme çalıştırmasında yalnızca bellekte tutulur. */
class Imports {
  private readonly byLegacy = new Map<string, ImportMarker>();

  constructor(
    private readonly store: Collection<ImportMarker>,
    private readonly kind: Kind,
  ) {}

  async load(): Promise<this> {
    for (const marker of await this.store.find({ kind: this.kind }).toArray()) {
      this.byLegacy.set(hex(marker.legacyId), marker);
    }
    return this;
  }

  get(legacyId: ObjectId): ImportMarker | undefined {
    return this.byLegacy.get(hex(legacyId));
  }

  all(): ImportMarker[] {
    return [...this.byLegacy.values()];
  }

  async add(legacyId: ObjectId, targetId: ObjectId, linked = false): Promise<void> {
    const marker: ImportMarker = {
      _id: `${this.kind}:${hex(legacyId)}`,
      kind: this.kind,
      legacyId,
      targetId,
      importedAt: new Date(),
      ...(linked ? { linked } : {}),
    };
    this.byLegacy.set(hex(legacyId), marker);
    if (!dryRun) await this.store.replaceOne({ _id: marker._id }, marker, { upsert: true });
  }

  async remove(marker: ImportMarker): Promise<void> {
    this.byLegacy.delete(hex(marker.legacyId));
    if (!dryRun) await this.store.deleteOne({ _id: marker._id });
  }

  /** legacyId taşıyan ama aktarım kaydı olmayan belgeler (betiğin önceki sürümüyle aktarılmış) sahiplenilir. */
  async adopt(docs: readonly { _id: ObjectId; legacyId?: ObjectId }[]): Promise<void> {
    for (const doc of docs) {
      if (doc.legacyId && !this.get(doc.legacyId)) await this.add(doc.legacyId, doc._id);
    }
  }
}

/* ---------------------------------------------------------------- */
/*  Cloudinary (isteğe bağlı): makale görsellerinin boyutları        */
/* ---------------------------------------------------------------- */

const cloudName = env("CLOUDINARY_CLOUD_NAME");
/** Sitenin kabul ettiği görsel adresleri (next.config.ts → images.remotePatterns). */
const ownImagePrefix = cloudName ? `https://res.cloudinary.com/${cloudName}/image/upload/` : "https://res.cloudinary.com/";
let cloudinaryEnabled = Boolean(cloudName && env("CLOUDINARY_API_KEY") && env("CLOUDINARY_API_SECRET"));
if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: env("CLOUDINARY_API_KEY"),
    api_secret: env("CLOUDINARY_API_SECRET"),
    secure: true,
  });
}

/** Görselin Cloudinary'deki asıl adresi ve boyutları; bulunamazsa null. */
async function findCloudinaryImage(
  publicId: string,
  label: string,
): Promise<Pick<StoredImage, "url" | "width" | "height"> | null> {
  if (!cloudinaryEnabled) return null;
  try {
    const resource = (await cloudinary.api.resource(publicId, { resource_type: "image", type: "upload" })) as {
      secure_url?: string;
      width?: number;
      height?: number;
    };
    if (resource.secure_url && resource.width && resource.height) {
      return { url: resource.secure_url, width: resource.width, height: resource.height };
    }
  } catch (error) {
    const httpCode = (error as { error?: { http_code?: number } }).error?.http_code;
    if (httpCode === 401 || httpCode === 403) {
      cloudinaryEnabled = false;
      warnings.push("Cloudinary bilgileri reddedildi; görsel boyutları alınamadı (site boyutu tarayıcıda ölçer).");
    } else if (httpCode === 404) {
      warnings.push(`${label}: kapak görseli Cloudinary'de bulunamadı (${publicId}); eski adres korundu.`);
    } else {
      warnings.push(`${label}: kapak görseli bilgisi alınamadı (${publicId}); eski adres korundu.`);
    }
  }
  return null;
}

/**
 * Cloudinary bilgisi alınamadan aktarılmış kapağın asıl adresi ve boyutları
 * sonradan tamamlanır (ör. anahtarlar sonra eklendiyse). İçerik değişmediği
 * için updatedAt'e dokunulmaz; kayıt "yeni panelde düzenlenmiş" sayılmaz.
 */
async function completeCoverSize(target: Collections, doc: ArticleDocument, label: string): Promise<boolean> {
  const cover = doc.coverImage;
  if (!cloudinaryEnabled || !cover.publicId || (cover.width && cover.height)) return false;
  const found = await findCloudinaryImage(cover.publicId, label);
  if (!found) return false;
  if (!dryRun) {
    await target.articles.updateOne(
      { _id: doc._id },
      { $set: { "coverImage.url": found.url, "coverImage.width": found.width, "coverImage.height": found.height } },
    );
  }
  Object.assign(cover, found);
  return true;
}

/* ---------------------------------------------------------------- */
/*  Kategoriler                                                     */
/* ---------------------------------------------------------------- */

/** Eski kategori kimliği → yeni kategori kimliği (makale ve videolar için). */
type CategoryMapping = Map<string, ObjectId>;

// Ad eşleşmesi: büyük/küçük harf duyarsız, Türkçe kurallarla (benzersiz ad indeksiyle aynı).
const nameKey = (name: string) => name.toLocaleLowerCase("tr");

async function syncCategories(source: Db, target: Collections, imports: Imports, result: Tally): Promise<CategoryMapping> {
  const mapping: CategoryMapping = new Map();
  const legacy = await source
    .collection<LegacyCategory>(LEGACY.categories)
    .find({})
    .sort({ createdAt: 1, _id: 1 })
    .toArray();
  const current = await target.categories.find({}).toArray();
  await imports.adopt(current);

  const byId = new Map(current.map((doc) => [hex(doc._id), doc]));
  const byName = new Map(current.map((doc) => [nameKey(doc.name), doc]));
  const slugs = new Set(current.map((doc) => doc.slug));

  for (const doc of legacy) {
    result.legacy += 1;
    const name = line(doc.name);
    const legacyUpdatedAt = updatedAtOf(doc);
    const marker = imports.get(doc._id);

    if (marker) {
      const existing = byId.get(hex(marker.targetId));
      if (!existing) {
        result.deletedHere += 1;
        continue;
      }
      mapping.set(hex(doc._id), existing._id);
      if (marker.linked || !changedThere(existing, legacyUpdatedAt)) {
        result.unchanged += 1;
        continue;
      }
      if (editedHere(existing)) {
        warnings.push(`Kategori ${quote(existing.name)}: iki panelde de değiştirilmiş; yeni sitedeki hâli korundu.`);
        result.unchanged += 1;
        continue;
      }
      const sameName = name ? byName.get(nameKey(name)) : undefined;
      if (name.length < 2 || (sameName && !sameName._id.equals(existing._id))) {
        warnings.push(`Kategori ${quote(existing.name)}: eski sistemdeki yeni adı (${quote(name)}) kullanılamıyor; güncellenmedi.`);
        result.unchanged += 1;
        continue;
      }
      slugs.delete(existing.slug);
      const fields = { name, slug: uniqueSlug(name, slugs), updatedAt: legacyUpdatedAt, legacyUpdatedAt };
      if (!dryRun) await target.categories.updateOne({ _id: existing._id }, { $set: fields });
      slugs.add(fields.slug);
      byName.delete(nameKey(existing.name));
      Object.assign(existing, fields);
      byName.set(nameKey(name), existing);
      result.updated += 1;
      continue;
    }

    if (name.length < 2) {
      warnings.push(`Kategori ${hex(doc._id)}: adı geçersiz; aktarılmadı.`);
      result.skipped += 1;
      continue;
    }

    // Yeni panelde aynı adla açılmış kategori varsa ona bağlanır.
    const sameName = byName.get(nameKey(name));
    if (sameName) {
      mapping.set(hex(doc._id), sameName._id);
      await imports.add(doc._id, sameName._id, true);
      result.unchanged += 1;
      continue;
    }

    const category: CategoryDocument = {
      _id: new ObjectId(),
      name,
      slug: uniqueSlug(name, slugs),
      createdAt: createdAtOf(doc),
      updatedAt: legacyUpdatedAt,
      legacyId: doc._id,
      legacyUpdatedAt,
    };
    if (!dryRun) await target.categories.insertOne(category);
    await imports.add(doc._id, category._id);
    slugs.add(category.slug);
    byId.set(hex(category._id), category);
    byName.set(nameKey(name), category);
    mapping.set(hex(doc._id), category._id);
    result.inserted += 1;
  }

  // Eski sistemde silinmiş kategoriler.
  const legacyIds = new Set(legacy.map((doc) => hex(doc._id)));
  for (const marker of imports.all()) {
    if (legacyIds.has(hex(marker.legacyId))) continue;
    const existing = byId.get(hex(marker.targetId));
    if (!existing) {
      await imports.remove(marker);
      continue;
    }
    if (marker.linked) continue;
    result.deletedThere += 1;
    if (!prune || editedHere(existing)) {
      warnings.push(deletedThereWarning(`Kategori ${quote(existing.name)}`));
      continue;
    }
    if (!dryRun) {
      await target.categories.deleteOne({ _id: existing._id });
      await target.articles.updateMany({ categoryId: existing._id }, { $set: { categoryId: null } });
      await target.videos.updateMany({ categoryId: existing._id }, { $set: { categoryId: null } });
    }
    await imports.remove(marker);
    result.removed += 1;
  }
  return mapping;
}

/** Eski kaydın kategorisi; eşlenemezse (silinmiş kategori) null. */
function mapCategory(value: unknown, mapping: CategoryMapping, label: string): ObjectId | null {
  const id = objectId(value);
  if (!id) return null;
  const mapped = mapping.get(hex(id));
  if (!mapped) warnings.push(`${label}: kategorisi bulunamadı (silinmiş olabilir); kategorisiz bırakıldı.`);
  return mapped ?? null;
}

/* ---------------------------------------------------------------- */
/*  Makaleler                                                       */
/* ---------------------------------------------------------------- */

/** Eski adres (slug) aynen korunur ki eski bağlantılar çalışmaya devam etsin. */
function legacySlug(doc: LegacyArticle, title: string): { slug: string; variants: string[] } {
  const raw = line(doc.slug);
  const slug = SLUG_PATTERN.test(raw) ? raw : slugify(raw || title);
  return { slug, variants: raw && raw !== slug ? [raw] : [] };
}

async function articleFields(doc: LegacyArticle, categories: CategoryMapping, label: string, previousCover?: StoredImage) {
  const title = line(doc.title);
  const content = normalizeArticleHtml(typeof doc.content === "string" ? doc.content : "", parser);

  // Kapak: aynı Cloudinary görseliyse kayıtlı bilgi korunur; değilse asıl adres ve boyutlar alınır.
  const publicId = line(doc.image?.publicId);
  const alt = line(doc.image?.alt) || title;
  let coverImage: StoredImage;
  if (previousCover && publicId && previousCover.publicId === publicId) {
    coverImage = { ...previousCover, alt };
  } else {
    coverImage = { url: line(doc.image?.url), alt };
    if (publicId) coverImage.publicId = publicId;
    const found = publicId ? await findCloudinaryImage(publicId, label) : null;
    if (found) Object.assign(coverImage, found);
  }

  // Özeti olmayan makalede özet, başlıklar hariç metnin başından üretilir.
  const summary = line(doc.summary) || truncate(stripHtml(content.replace(/<h([1-6])\b[^>]*>[\s\S]*?<\/h\1>/gi, " ")), 160);
  const keywords = [
    ...new Map(
      (Array.isArray(doc.keywords) ? doc.keywords : [])
        .map(line)
        .filter(Boolean)
        .map((keyword) => [keyword.toLocaleLowerCase("tr"), keyword] as const),
    ).values(),
  ];
  const minutes = doc.readingMinutes;
  const readingMinutes =
    typeof minutes === "number" && Number.isInteger(minutes) && minutes >= 1 && minutes <= 120
      ? minutes
      : estimateReadingMinutes(content);

  if (!coverImage.url) warnings.push(`${label}: kapak görseli yok; taslak olarak tutuluyor.`);
  else if (!coverImage.url.startsWith(ownImagePrefix)) {
    warnings.push(`${label}: kapak görseli bu sitenin Cloudinary hesabında değil (${truncate(coverImage.url, 80)}).`);
  }
  if (summary.length > 300) warnings.push(`${label}: özeti 300 karakterden uzun; düzenlerken kısaltılmalı.`);
  if (keywords.length > 10 || keywords.some((keyword) => keyword.length > 80)) {
    warnings.push(`${label}: anahtar kelimeleri yeni sınırları aşıyor (en fazla 10 adet, 80 karakter); düzenlerken gözden geçirilmeli.`);
  }

  return {
    title,
    summary,
    content,
    coverImage,
    categoryId: mapCategory(doc.category, categories, label),
    keywords,
    readingMinutes,
  };
}

async function syncArticles(source: Db, target: Collections, categories: CategoryMapping, imports: Imports, result: Tally) {
  const legacy = await source
    .collection<LegacyArticle>(LEGACY.articles)
    .find({})
    .sort({ createdAt: 1, _id: 1 })
    .toArray();
  const current = await target.articles.find({}).toArray();
  await imports.adopt(current);

  const byId = new Map(current.map((doc) => [hex(doc._id), doc]));
  // Adres → sahibi (geçerli ve eski adresler); çakışma denetimi için.
  const slugOwners = new Map<string, string>();
  for (const doc of current) {
    for (const slug of [doc.slug, ...(doc.previousSlugs ?? [])]) slugOwners.set(slug, hex(doc._id));
  }

  for (const doc of legacy) {
    result.legacy += 1;
    const title = line(doc.title);
    const label = `Makale ${quote(title || hex(doc._id))}`;
    const legacyUpdatedAt = updatedAtOf(doc);
    const marker = imports.get(doc._id);
    const valid = title.length >= 3 && Boolean(stripHtml(typeof doc.content === "string" ? doc.content : ""));

    if (marker) {
      const existing = byId.get(hex(marker.targetId));
      if (!existing) {
        result.deletedHere += 1;
        continue;
      }
      if (!changedThere(existing, legacyUpdatedAt) || editedHere(existing) || !valid) {
        if (changedThere(existing, legacyUpdatedAt)) {
          warnings.push(
            editedHere(existing)
              ? `${label}: iki panelde de değiştirilmiş; yeni sitedeki hâli korundu.`
              : `${label}: eski sistemdeki hâli geçersiz (başlık veya içerik boş); güncellenmedi.`,
          );
        }
        if (await completeCoverSize(target, existing, label)) result.completed += 1;
        result.unchanged += 1;
        continue;
      }

      const fields = await articleFields(doc, categories, label, existing.coverImage);
      const { slug: wanted, variants } = legacySlug(doc, fields.title);
      const previousSlugs = new Set([...(existing.previousSlugs ?? []), ...variants]);
      let slug = existing.slug;
      if (wanted !== existing.slug) {
        const owner = slugOwners.get(wanted);
        if (owner && owner !== hex(existing._id)) {
          warnings.push(`${label}: eski sistemdeki yeni adresi (“${wanted}”) başka bir makalede kullanılıyor; adres değiştirilmedi.`);
        } else {
          // Yayındaki makalenin eski adresi yeni adrese yönlenir (paneldeki kuralla aynı).
          if (existing.status === "published") previousSlugs.add(existing.slug);
          previousSlugs.delete(wanted);
          slug = wanted;
        }
      }

      const update = { ...fields, slug, previousSlugs: [...previousSlugs], updatedAt: legacyUpdatedAt, legacyUpdatedAt };
      if (!dryRun) {
        await target.articles.updateOne({ _id: existing._id }, { $set: update });
        if (slug !== existing.slug) {
          await target.videos.updateMany({ relatedArticleSlug: existing.slug }, { $set: { relatedArticleSlug: slug } });
        }
      }
      for (const value of [slug, ...previousSlugs]) slugOwners.set(value, hex(existing._id));
      Object.assign(existing, update);
      result.updated += 1;
      continue;
    }

    if (!valid) {
      warnings.push(`${label}: başlığı veya içeriği boş; aktarılmadı.`);
      result.skipped += 1;
      continue;
    }

    const fields = await articleFields(doc, categories, label);
    const { slug: wanted, variants } = legacySlug(doc, fields.title);
    let slug = wanted;
    if (!slug || slugOwners.has(slug)) {
      slug = uniqueSlug(slug || fields.title, slugOwners.keys());
      warnings.push(`${label}: “${wanted}” adresi yeni sitede başka bir makalede kullanılıyor; “${slug}” verildi.`);
    }

    // Kapağı olmayan makale sitede gösterilemez; taslak olarak aktarılır.
    const publishable = Boolean(fields.coverImage.url);
    const createdAt = createdAtOf(doc);
    const article: ArticleDocument = {
      _id: new ObjectId(),
      ...fields,
      slug,
      status: publishable ? "published" : "draft",
      // Eski site yayın tarihi olarak oluşturulma tarihini gösteriyordu.
      publishedAt: publishable ? createdAt : null,
      createdAt,
      updatedAt: legacyUpdatedAt,
      previousSlugs: variants.filter((variant) => !slugOwners.has(variant)),
      legacyId: doc._id,
      legacyUpdatedAt,
    };
    if (!dryRun) await target.articles.insertOne(article);
    await imports.add(doc._id, article._id);
    byId.set(hex(article._id), article);
    for (const value of [article.slug, ...(article.previousSlugs ?? [])]) slugOwners.set(value, hex(article._id));
    result.inserted += 1;
  }

  // Eski sistemde silinmiş makaleler.
  const legacyIds = new Set(legacy.map((doc) => hex(doc._id)));
  for (const marker of imports.all()) {
    if (legacyIds.has(hex(marker.legacyId))) continue;
    const existing = byId.get(hex(marker.targetId));
    if (!existing) {
      await imports.remove(marker);
      continue;
    }
    result.deletedThere += 1;
    if (!prune || editedHere(existing)) {
      warnings.push(deletedThereWarning(`Makale ${quote(existing.title)}`));
      continue;
    }
    if (!dryRun) {
      await target.articles.deleteOne({ _id: existing._id });
      await target.videos.updateMany({ relatedArticleSlug: existing.slug }, { $set: { relatedArticleSlug: null } });
    }
    await imports.remove(marker);
    result.removed += 1;
  }
}

/* ---------------------------------------------------------------- */
/*  Videolar                                                        */
/* ---------------------------------------------------------------- */

async function syncVideos(source: Db, target: Collections, categories: CategoryMapping, imports: Imports, result: Tally) {
  const legacy = await source
    .collection<LegacyVideo>(LEGACY.videos)
    .find({})
    .sort({ createdAt: 1, _id: 1 })
    .toArray();
  const current = await target.videos.find({}).toArray();
  await imports.adopt(current);

  const byId = new Map(current.map((doc) => [hex(doc._id), doc]));
  const youtubeOwners = new Map(current.map((doc) => [doc.youtubeId, hex(doc._id)]));

  for (const doc of legacy) {
    result.legacy += 1;
    const title = line(doc.title);
    const label = `Video ${quote(title || hex(doc._id))}`;
    const youtubeId = parseYouTubeId(line(doc.youtubeId));
    const legacyUpdatedAt = updatedAtOf(doc);
    const marker = imports.get(doc._id);

    if (marker) {
      const existing = byId.get(hex(marker.targetId));
      if (!existing) {
        result.deletedHere += 1;
        continue;
      }
      if (!changedThere(existing, legacyUpdatedAt)) {
        result.unchanged += 1;
        continue;
      }
      if (editedHere(existing)) {
        warnings.push(`${label}: iki panelde de değiştirilmiş; yeni sitedeki hâli korundu.`);
        result.unchanged += 1;
        continue;
      }
      if (!youtubeId || title.length < 3) {
        warnings.push(`${label}: eski sistemdeki hâli geçersiz; güncellenmedi.`);
        result.unchanged += 1;
        continue;
      }

      let coverImage: StoredImage = { ...existing.coverImage, alt: title };
      if (youtubeId !== existing.youtubeId) {
        const owner = youtubeOwners.get(youtubeId);
        if (owner && owner !== hex(existing._id)) {
          warnings.push(`${label}: yeni YouTube videosu (${youtubeId}) sitede zaten var; güncellenmedi.`);
          result.unchanged += 1;
          continue;
        }
        const cover = await resolveYouTubeCover(youtubeId, title);
        if (cover.status === "not-found") {
          warnings.push(`${label}: yeni YouTube videosu (${youtubeId}) bulunamadı; güncellenmedi.`);
          result.unchanged += 1;
          continue;
        }
        coverImage = cover.cover;
      }

      const update = {
        title,
        youtubeId,
        coverImage,
        categoryId: mapCategory(doc.category, categories, label),
        updatedAt: legacyUpdatedAt,
        legacyUpdatedAt,
      };
      if (!dryRun) await target.videos.updateOne({ _id: existing._id }, { $set: update });
      youtubeOwners.delete(existing.youtubeId);
      youtubeOwners.set(youtubeId, hex(existing._id));
      Object.assign(existing, update);
      result.updated += 1;
      continue;
    }

    if (!youtubeId || title.length < 3) {
      warnings.push(`${label}: YouTube kimliği veya başlığı geçersiz; aktarılmadı.`);
      result.skipped += 1;
      continue;
    }
    if (youtubeOwners.has(youtubeId)) {
      warnings.push(`${label}: bu YouTube videosu (${youtubeId}) yeni sitede zaten var; aktarılmadı.`);
      result.skipped += 1;
      continue;
    }

    // Kapak, yeni sitedeki gibi doğrudan YouTube'dan alınır (eski Cloudinary kopyası kullanılmaz).
    const cover = await resolveYouTubeCover(youtubeId, title);
    if (cover.status === "not-found") {
      warnings.push(`${label}: YouTube'da bulunamadı (silinmiş veya gizli olabilir; ${youtubeId}); aktarılmadı.`);
      result.skipped += 1;
      continue;
    }

    const createdAt = createdAtOf(doc);
    const video: VideoDocument = {
      _id: new ObjectId(),
      title,
      youtubeId,
      description: "",
      coverImage: cover.cover,
      categoryId: mapCategory(doc.category, categories, label),
      durationSeconds: null,
      relatedArticleSlug: null,
      publishedAt: createdAt,
      createdAt,
      updatedAt: legacyUpdatedAt,
      legacyId: doc._id,
      legacyUpdatedAt,
    };
    if (!dryRun) await target.videos.insertOne(video);
    await imports.add(doc._id, video._id);
    byId.set(hex(video._id), video);
    youtubeOwners.set(youtubeId, hex(video._id));
    result.inserted += 1;
  }

  // Eski sistemde silinmiş videolar.
  const legacyIds = new Set(legacy.map((doc) => hex(doc._id)));
  for (const marker of imports.all()) {
    if (legacyIds.has(hex(marker.legacyId))) continue;
    const existing = byId.get(hex(marker.targetId));
    if (!existing) {
      await imports.remove(marker);
      continue;
    }
    result.deletedThere += 1;
    if (!prune || editedHere(existing)) {
      warnings.push(deletedThereWarning(`Video ${quote(existing.title)}`));
      continue;
    }
    if (!dryRun) await target.videos.deleteOne({ _id: existing._id });
    await imports.remove(marker);
    result.removed += 1;
  }
}

/* ---------------------------------------------------------------- */
/*  İletişim mesajları                                              */
/* ---------------------------------------------------------------- */

async function syncContacts(source: Db, target: Collections, imports: Imports, result: Tally) {
  const legacy = await source
    .collection<LegacyContact>(LEGACY.contacts)
    .find({})
    .sort({ createdAt: 1, _id: 1 })
    .toArray();
  const current = await target.contactMessages.find({ legacyId: { $exists: true } }).toArray();
  await imports.adopt(current);
  const byId = new Map(current.map((doc) => [hex(doc._id), doc]));

  for (const doc of legacy) {
    result.legacy += 1;
    const marker = imports.get(doc._id);
    if (marker) {
      // Eski sistemde mesajlar düzenlenemiyordu; yalnızca varlığı denetlenir.
      if (byId.has(hex(marker.targetId))) result.unchanged += 1;
      else result.deletedHere += 1;
      continue;
    }

    const message = typeof doc.content === "string" ? doc.content.trim().replace(/\r\n?/g, "\n") : "";
    if (!message) {
      warnings.push(`Mesaj ${hex(doc._id)}: içeriği boş; aktarılmadı.`);
      result.skipped += 1;
      continue;
    }

    const contact: ContactMessageDocument = {
      _id: new ObjectId(),
      name: line(doc.name) || "İsimsiz",
      email: line(doc.email) || null,
      phone: line(doc.phone) || null,
      subject: line(doc.title) || "(Konu yok)",
      message,
      // Eski panelde görülmüş mesajlar; okunmamış sayacını şişirmemesi için "okundu".
      status: "read",
      createdAt: createdAtOf(doc),
      legacyId: doc._id,
    };
    if (!dryRun) await target.contactMessages.insertOne(contact);
    await imports.add(doc._id, contact._id);
    byId.set(hex(contact._id), contact);
    result.inserted += 1;
  }

  // Eski sistemde silinmiş mesajlar (yeni panelde okunmadı/arşiv olarak işaretlenenler korunur).
  const legacyIds = new Set(legacy.map((doc) => hex(doc._id)));
  for (const marker of imports.all()) {
    if (legacyIds.has(hex(marker.legacyId))) continue;
    const existing = byId.get(hex(marker.targetId));
    if (!existing) {
      await imports.remove(marker);
      continue;
    }
    result.deletedThere += 1;
    if (!prune || existing.status !== "read") {
      warnings.push(deletedThereWarning(`Mesaj ${quote(existing.subject)}`));
      continue;
    }
    if (!dryRun) await target.contactMessages.deleteOne({ _id: existing._id });
    await imports.remove(marker);
    result.removed += 1;
  }
}

/* ---------------------------------------------------------------- */

function report(name: string, item: Tally) {
  const verbs = dryRun
    ? { inserted: "eklenecek", updated: "güncellenecek", removed: "silinecek" }
    : { inserted: "eklendi", updated: "güncellendi", removed: "silindi" };
  const parts = [
    `${item.legacy} eski kayıt`,
    `${item.inserted} ${verbs.inserted}`,
    `${item.updated} ${verbs.updated}`,
    `${item.unchanged} değişmedi`,
  ];
  if (item.skipped) parts.push(`${item.skipped} atlandı`);
  if (item.deletedHere) parts.push(`${item.deletedHere} yeni panelde silinmiş`);
  if (item.deletedThere) parts.push(`${item.deletedThere} eski sistemde silinmiş (${item.removed} ${verbs.removed})`);
  if (item.completed) parts.push(`${item.completed} kapak boyutu ${dryRun ? "tamamlanacak" : "tamamlandı"}`);
  console.log(`${name.padEnd(12)} ${parts.join(" · ")}`);
}

async function main() {
  const unknown = [...options].filter((option) => option !== "--dry-run" && option !== "--prune");
  if (unknown.length > 0) fail(`Bilinmeyen seçenek: ${unknown.join(" ")} (yalnızca --dry-run ve --prune desteklenir).`);

  const targetUri = env("MONGODB_URI") ?? fail("MONGODB_URI tanımlı değil (bkz. .env.example).");
  const sourceUri = env("LEGACY_MONGODB_URI") ?? targetUri;
  for (const uri of [targetUri, sourceUri]) {
    if (!/^mongodb(\+srv)?:\/\//.test(uri)) fail("MongoDB adresi mongodb:// veya mongodb+srv:// ile başlamalı.");
  }

  const clientOptions = { appName: "alpertunaozkan-migrate", serverSelectionTimeoutMS: 10_000 };
  const targetClient = await new MongoClient(targetUri, clientOptions).connect();
  const sourceClient = sourceUri === targetUri ? targetClient : await new MongoClient(sourceUri, clientOptions).connect();

  try {
    const targetDb = targetClient.db(env("MONGODB_DB"));
    const sourceDb = sourceClient.db(env("LEGACY_MONGODB_DB"));
    const target = collections(targetDb);

    const existingLegacy = new Set((await sourceDb.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name));
    const missing = Object.values(LEGACY).filter((name) => !existingLegacy.has(name));
    if (missing.length === Object.keys(LEGACY).length) {
      fail(`Eski koleksiyonlar “${sourceDb.databaseName}” veritabanında bulunamadı. LEGACY_MONGODB_DB ile doğru veritabanını belirtin.`);
    }

    console.log(dryRun ? "Deneme çalıştırması: hiçbir şey yazılmayacak.\n" : "Eski veriler aktarılıyor / eşitleniyor.\n");
    console.log(`Kaynak (eski, yalnızca okunur): ${sourceDb.databaseName}`);
    console.log(`Hedef (yeni site):              ${targetDb.databaseName}`);
    if (missing.length > 0) console.log(`Bulunamayan eski koleksiyonlar: ${missing.join(", ")}`);
    if (!cloudinaryEnabled) console.log("Cloudinary ayarları yok: görsel boyutları alınmayacak (site tarayıcıda ölçer).");
    console.log("");

    if (!dryRun) await ensureIndexes(targetDb);
    const store = targetDb.collection<ImportMarker>(IMPORTS_COLLECTION);
    const importsOf = (kind: Kind) => new Imports(store, kind).load();

    const results = { Kategoriler: tally(), Makaleler: tally(), Videolar: tally(), Mesajlar: tally() };
    const categoryMapping = await syncCategories(sourceDb, target, await importsOf("categories"), results.Kategoriler);
    await syncArticles(sourceDb, target, categoryMapping, await importsOf("articles"), results.Makaleler);
    await syncVideos(sourceDb, target, categoryMapping, await importsOf("videos"), results.Videolar);
    await syncContacts(sourceDb, target, await importsOf("contacts"), results.Mesajlar);

    for (const [name, item] of Object.entries(results)) report(name, item);
    if (warnings.length > 0) {
      console.log(`\nUyarılar (${warnings.length}):`);
      for (const warning of warnings) console.log(`  • ${warning}`);
    }
    const changed = Object.values(results).some((item) => item.inserted + item.updated + item.removed + item.completed > 0);
    if (!dryRun && changed) {
      console.log("\nTamamlandı. Site çalışıyorsa güncel içerik için yeniden derleyin veya panelden bir kayıt kaydedin.");
    }
  } finally {
    await targetClient.close();
    if (sourceClient !== targetClient) await sourceClient.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
