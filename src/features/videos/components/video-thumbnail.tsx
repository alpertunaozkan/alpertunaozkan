"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { FramedImage } from "@/components/common/framed-image";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { youtubeThumbnailUrl } from "@/lib/youtube";
import type { ImageAsset, Video } from "@/types";

interface VideoThumbnailProps {
  video: Pick<Video, "coverImage" | "durationSeconds">;
  sizes: string;
  preload?: boolean;
  className?: string;
}

const YOUTUBE_COVER = /^https:\/\/i\.ytimg\.com\/vi\/([\w-]{11})\/(maxresdefault|sddefault)\.jpg$/;

/** YouTube kapak çeşidi bulunamazsa bir alttaki çeşit (maxres → sd → hq); her videoda hqdefault vardır. */
function lowerYouTubeCover(url: string): string | null {
  const match = url.match(YOUTUBE_COVER);
  if (!match) return null;
  return youtubeThumbnailUrl(match[1], match[2] === "maxresdefault" ? "sddefault" : "hqdefault");
}

interface VideoCoverProps {
  image: ImageAsset;
  sizes: string;
  preload?: boolean;
  className?: string;
  imageClassName?: string;
}

/**
 * Videonun kapak görseli: 16:9 çerçeveyi doldurur (YouTube'un 4:3 çeşitlerindeki
 * siyah şeritler kırpılır). Kayıtlı çeşit YouTube'da artık yoksa bir alttaki
 * çeşide geçer; böylece kart hiçbir zaman boş kalmaz.
 */
export function VideoCover({ image, sizes, preload = false, className, imageClassName }: VideoCoverProps) {
  const [fallback, setFallback] = useState<{ from: string; url: string } | null>(null);
  const cover: ImageAsset = fallback?.from === image.url ? { url: fallback.url, alt: image.alt } : image;

  return (
    <FramedImage
      image={cover}
      frameRatio={16 / 9}
      fit="cover"
      sizes={sizes}
      preload={preload}
      className={className}
      imageClassName={imageClassName}
      onError={() => {
        const lower = lowerYouTubeCover(cover.url);
        if (lower) setFallback({ from: image.url, url: lower });
      }}
    />
  );
}

/** Kapak (YouTube'daki kapak görseli) + oynat simgesi + süre etiketi. Video oynatıcı yüklemez. */
export function VideoThumbnail({ video, sizes, preload = false, className }: VideoThumbnailProps) {
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-navy-900", className)}>
      <VideoCover
        image={video.coverImage}
        sizes={sizes}
        preload={preload}
        className="absolute inset-0"
        imageClassName="opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/10 to-transparent" />
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 inline-flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-navy-950 shadow-elevated transition-transform duration-300 group-hover:scale-105"
      >
        <Play className="ml-0.5 size-6 fill-current" />
      </span>
      {video.durationSeconds ? (
        <span className="absolute right-3 bottom-3 rounded-md bg-navy-950/80 px-2 py-0.5 text-xs font-medium text-white tabular-nums">
          <span className="sr-only">Süre: </span>
          {formatDuration(video.durationSeconds)}
        </span>
      ) : null}
    </div>
  );
}
