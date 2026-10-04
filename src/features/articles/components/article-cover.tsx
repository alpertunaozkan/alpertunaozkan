import Image from "next/image";
import type { CSSProperties } from "react";
import { ImageBackdrop } from "@/components/common/image-backdrop";
import { imageRatio } from "@/lib/image-ratio";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";

/** Kapak bu oran aralığında görselin kendi oranını alır (≈3:5 dikey … ≈12:5 panoramik). */
const MIN_RATIO = 0.6;
const MAX_RATIO = 2.4;

interface ArticleCoverProps {
  image: ImageAsset;
  preload?: boolean;
  className?: string;
}

/**
 * Makale sayfasındaki kapak görseli. Avukatın yüklediği görsel yatay, dikey
 * veya kare olabilir: çerçeve görselin kendi oranını alır, yüksekliği ekranın
 * ~%72'siyle sınırlanır ve görsel hiçbir zaman kırpılmaz. Çok uç oranlarda
 * kalan boşluk, görselin bulanık hâliyle doldurulur.
 *
 * Boyutları bilinmeyen görsel (boyut bilgisi olmayan eski kayıt) 16:9
 * çerçevede, kırpılmadan gösterilir; sayfa yüklendikten sonra çerçeve
 * değişmez (içerik kaymaz). Kalıcı çözüm: görsel boyutlarının kayda eklenmesi.
 */
export function ArticleCover({ image, preload = false, className }: ArticleCoverProps) {
  const natural = imageRatio(image);
  const ratio = natural === null ? 16 / 9 : Math.min(MAX_RATIO, Math.max(MIN_RATIO, natural));
  const letterboxed = natural === null || ratio !== natural;

  return (
    <div
      style={{ "--cover-ratio": ratio } as CSSProperties}
      className={cn(
        "relative mx-auto aspect-[var(--cover-ratio)] w-[min(100%,calc(min(72svh,40rem)*var(--cover-ratio)))] max-w-5xl overflow-hidden rounded-2xl bg-navy-100 shadow-elevated",
        className,
      )}
    >
      {letterboxed ? <ImageBackdrop image={image} /> : null}
      <Image
        src={image.url}
        alt={image.alt}
        fill
        preload={preload}
        sizes="(min-width: 1024px) 64rem, 100vw"
        quality={75}
        unoptimized={image.url.startsWith("blob:")}
        className="object-contain"
      />
    </div>
  );
}
