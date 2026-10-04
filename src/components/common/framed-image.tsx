"use client";

import Image from "next/image";
import { useState } from "react";
import { fitsFrame, imageRatio } from "@/lib/image-ratio";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";
import { ImageBackdrop } from "./image-backdrop";

interface FramedImageProps {
  image: ImageAsset;
  /** Çerçevenin en/boy oranı (ör. 16 / 10). Çerçevenin ölçüsü `className` ile verilir. */
  frameRatio: number;
  sizes: string;
  /**
   * "auto": oran yakınsa doldur, değilse tamamını göster. "contain": her zaman
   * tamamını göster. "cover": her zaman doldur (YouTube kapakları: 4:3
   * çeşitlerdeki siyah şeritler kırpılır).
   */
  fit?: "auto" | "contain" | "cover";
  preload?: boolean;
  quality?: number;
  className?: string;
  imageClassName?: string;
  /** Görsel yüklenemezse (ör. kaynakta yoksa) çağrılır. */
  onError?: () => void;
}

/**
 * Sabit oranlı bir çerçevede (kart, küçük resim) her oranda görseli düzgün
 * gösterir: yatay görseller çerçeveyi doldurur; dikey, kare veya panoramik
 * görseller kırpılmadan ortalanır ve kenarları bulanık arka planla dolar.
 *
 * Boyutları bilinmeyen görselde (ör. boyut bilgisi olmayan eski kayıtlar)
 * önce tamamı gösterilir; görsel yüklenince gerçek oranı okunur ve oranı
 * çerçeveye uygunsa çerçeveyi doldurur.
 */
export function FramedImage({
  image,
  frameRatio,
  sizes,
  fit = "auto",
  preload = false,
  quality = 70,
  className,
  imageClassName,
  onError,
}: FramedImageProps) {
  const [measured, setMeasured] = useState<{ url: string; width: number; height: number } | null>(null);
  const known = imageRatio(image) !== null;
  const size = known ? image : measured?.url === image.url ? measured : null;
  const fill = fit === "cover" || (fit === "auto" && size !== null && fitsFrame(size, frameRatio));

  return (
    <div className={cn("relative overflow-hidden bg-navy-100", className)}>
      {fill ? null : <ImageBackdrop image={image} />}
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes}
        preload={preload}
        quality={quality}
        unoptimized={image.url.startsWith("blob:")}
        onLoad={
          known || fit !== "auto"
            ? undefined
            : (event) => {
                const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
                if (width && height) setMeasured({ url: image.url, width, height });
              }
        }
        onError={onError}
        className={cn(fill ? "object-cover" : "object-contain", imageClassName)}
      />
    </div>
  );
}
