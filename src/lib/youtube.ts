const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * YouTube linkinden veya doğrudan ID'den video kimliğini çıkarır.
 * Desteklenen biçimler: watch?v=, youtu.be/, /embed/, /shorts/, /live/
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\.|^m\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1, 12);
      return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && YOUTUBE_ID_PATTERN.test(fromQuery)) return fromQuery;

      const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
      return match?.[1] ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * YouTube'un kapak görseli çeşitleri, kaliteye göre (eski API ile aynı sıra).
 * maxresdefault 1280×720 (16:9); sddefault 640×480 ve hqdefault 480×360 ise
 * 4:3'tür ve 16:9 videolarda üstte/altta siyah şerit içerir.
 */
export const YOUTUBE_COVER_VARIANTS = ["maxresdefault", "sddefault", "hqdefault"] as const;
export type YouTubeCoverVariant = (typeof YOUTUBE_COVER_VARIANTS)[number];

export function youtubeThumbnailUrl(id: string, variant: YouTubeCoverVariant = "maxresdefault"): string {
  return `https://i.ytimg.com/vi/${id}/${variant}.jpg`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Gizlilik odaklı gömme adresi; yalnızca kullanıcı oynat dediğinde yüklenir. */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
}
