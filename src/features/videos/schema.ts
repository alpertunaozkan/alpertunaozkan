import { z } from "zod";
import { parseYouTubeId } from "@/lib/youtube";

const DURATION_PATTERN = /^\d{1,3}:[0-5]\d$/;

/** Panel video formu doğrulaması (eski API: başlık ≥ 3 karakter + geçerli YouTube ID). */
export const videoFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Başlık en az 3 karakter olmalıdır")
    .max(160, "Başlık en fazla 160 karakter olabilir"),
  youtube: z
    .string()
    .trim()
    .min(1, "YouTube linki veya video ID'si girin")
    .refine((value) => parseYouTubeId(value) !== null, "Geçerli bir YouTube linki veya 11 karakterlik video ID'si girin"),
  description: z.string().trim().max(600, "Açıklama en fazla 600 karakter olabilir"),
  categoryId: z.string().nullable(),
  duration: z
    .string()
    .trim()
    .refine((value) => value === "" || DURATION_PATTERN.test(value), "Süreyi dk:sn biçiminde girin (örn. 4:09)"),
  relatedArticleSlug: z.string().nullable(),
});

export type VideoFormValues = z.input<typeof videoFormSchema>;

/** Sunucuda kaydedilen video bilgisi (panel formunun ürettiği VideoInput). */
export const videoInputSchema = z.object({
  title: z.string().trim().min(3, "Başlık en az 3 karakter olmalıdır").max(160, "Başlık en fazla 160 karakter olabilir"),
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, "Geçerli bir YouTube video ID'si girin"),
  description: z.string().trim().max(600, "Açıklama en fazla 600 karakter olabilir"),
  categoryId: z.string().nullable(),
  durationSeconds: z.number().int().min(1).max(86_400).nullable(),
  relatedArticleSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).nullable(),
});

/** "4:09" → 249 */
export function parseDuration(value: string): number | null {
  const match = value.trim().match(/^(\d{1,3}):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
