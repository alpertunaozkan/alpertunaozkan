import { YOUTUBE_COVER_VARIANTS, youtubeThumbnailUrl, type YouTubeCoverVariant } from "@/lib/youtube";
import type { StoredImage } from "./documents";

/** YouTube kapak çeşitlerinin sabit boyutları. */
const VARIANT_SIZE: Record<YouTubeCoverVariant, { width: number; height: number }> = {
  maxresdefault: { width: 1280, height: 720 },
  sddefault: { width: 640, height: 480 },
  hqdefault: { width: 480, height: 360 },
};

export type YouTubeCoverResult = { status: "found"; cover: StoredImage } | { status: "not-found" };

/**
 * Videonun YouTube'daki kapağını bulur: mevcut olan en yüksek çözünürlüklü
 * çeşit (maxres → sd → hq). YouTube olmayan çeşit için 404 döndürür.
 * YouTube'a hiç ulaşılamazsa (ağ sorunu) her videoda bulunan hqdefault
 * kullanılır; kayıt engellenmez.
 *
 * Not: Bu dosya "server-only" içe aktarmaz; aktarma betiği
 * (scripts/migrate-legacy.ts) de kullanır.
 */
export async function resolveYouTubeCover(youtubeId: string, title: string): Promise<YouTubeCoverResult> {
  let reachable = false;
  for (const variant of YOUTUBE_COVER_VARIANTS) {
    const url = youtubeThumbnailUrl(youtubeId, variant);
    try {
      const response = await fetch(url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(5_000) });
      reachable = true;
      if (response.ok) return { status: "found", cover: { url, alt: title, ...VARIANT_SIZE[variant] } };
    } catch {
      // Bir sonraki çeşit denenir.
    }
  }
  if (!reachable) {
    return { status: "found", cover: { url: youtubeThumbnailUrl(youtubeId, "hqdefault"), alt: title, ...VARIANT_SIZE.hqdefault } };
  }
  return { status: "not-found" };
}
