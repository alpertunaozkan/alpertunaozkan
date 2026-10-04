import { z } from "zod";
import { countWords } from "@/lib/text";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Arama sonuçlarında ideal açıklama uzunluğu. */
export const SUMMARY_IDEAL = { min: 120, max: 155 } as const;

/*
 * Makale formu doğrulaması. Taslaklar eksik kaydedilebilir; "Yayında"
 * durumunda özet, içerik, kapak (alt metin dahil) ve kategori zorunludur.
 * Eski API'deki kurallar (başlık ≥ 3, alt metin ≥ 3 vb.) kapsanmıştır.
 */
export const articleFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Başlık en az 3 karakter olmalıdır")
      .max(200, "Başlık en fazla 200 karakter olabilir"),
    slug: z
      .string()
      .trim()
      .min(3, "Adres en az 3 karakter olmalıdır")
      .max(200, "Adres en fazla 200 karakter olabilir")
      .regex(SLUG_PATTERN, "Adres yalnızca küçük harf, rakam ve tire içerebilir"),
    summary: z.string().trim().max(300, "Özet en fazla 300 karakter olabilir"),
    content: z.string().max(500_000, "İçerik çok uzun"),
    coverImage: z.object({
      url: z.string().max(2_000),
      alt: z.string().trim().max(200, "Alt metin en fazla 200 karakter olabilir"),
      // Görselin gerçek boyutları: sitede oranı (yatay/dikey/kare) belirlemek için.
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      /** Cloudinary public_id. */
      publicId: z.string().max(300).optional(),
    }),
    categoryId: z.string().nullable(),
    keywords: z
      .array(z.string().trim().min(1).max(80, "Anahtar kelime en fazla 80 karakter olabilir"))
      .max(10, "En fazla 10 anahtar kelime eklenebilir"),
    readingMinutes: z
      .number()
      .int("Okuma süresi tam sayı olmalıdır")
      .min(1, "Okuma süresi en az 1 dakika olmalıdır")
      .max(120, "Okuma süresi en fazla 120 dakika olabilir"),
    status: z.enum(["published", "draft"]),
  })
  .superRefine((data, ctx) => {
    if (data.status !== "published") return;
    const require = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });

    if (data.summary.length < 50) require(["summary"], "Yayınlamak için en az 50 karakterlik bir özet yazın");
    if (countWords(data.content) < 20) require(["content"], "Yayınlamak için içerik en az 20 kelime olmalıdır");
    if (!data.coverImage.url) require(["coverImage", "url"], "Yayınlamak için bir kapak görseli seçin");
    if (data.coverImage.alt.length < 3) require(["coverImage", "alt"], "Kapak görseli için en az 3 karakterlik bir açıklama girin");
    if (!data.categoryId) require(["categoryId"], "Yayınlamak için bir kategori seçin");
  });
