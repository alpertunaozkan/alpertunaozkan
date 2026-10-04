"use client";

import { useEffect, useState } from "react";
import { YOUTUBE_COVER_VARIANTS, youtubeThumbnailUrl } from "@/lib/youtube";

export interface YouTubeCover {
  url: string;
  width: number;
  height: number;
}

/** YouTube, olmayan bir kapak çeşidi için 120×90 boyutunda boş bir görsel döndürür. */
const PLACEHOLDER_MAX_WIDTH = 120;

function loadImageSize(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

/**
 * Videonun YouTube'daki kapak görselini bulur; mevcut olan en yüksek
 * çözünürlüklü çeşit seçilir. Hiçbiri yoksa (yanlış ID, silinmiş veya gizli
 * video) null döner.
 *
 * Tarayıcıda çalışır ve yalnızca paneldeki önizleme/ön kontrol içindir.
 * Kaydedilen kapak sunucuda aynı sırayla yeniden belirlenir
 * (src/server/youtube.ts).
 */
export async function findYouTubeCover(youtubeId: string): Promise<YouTubeCover | null> {
  for (const variant of YOUTUBE_COVER_VARIANTS) {
    const url = youtubeThumbnailUrl(youtubeId, variant);
    const size = await loadImageSize(url);
    if (size && size.width > PLACEHOLDER_MAX_WIDTH) return { url, ...size };
  }
  return null;
}

export type YouTubeCoverState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; cover: YouTubeCover }
  | { status: "missing" };

/** Girilen video ID'sinin kapak görselini arka planda bulur (form önizlemesi için). */
export function useYouTubeCover(youtubeId: string | null): YouTubeCoverState {
  const [result, setResult] = useState<{ id: string; cover: YouTubeCover | null } | null>(null);

  useEffect(() => {
    if (!youtubeId) return;
    let cancelled = false;
    findYouTubeCover(youtubeId).then((cover) => {
      if (!cancelled) setResult({ id: youtubeId, cover });
    });
    return () => {
      cancelled = true;
    };
  }, [youtubeId]);

  if (!youtubeId) return { status: "idle" };
  if (result?.id !== youtubeId) return { status: "loading" };
  return result.cover ? { status: "found", cover: result.cover } : { status: "missing" };
}
