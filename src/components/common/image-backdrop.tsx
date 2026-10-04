import Image from "next/image";
import type { ImageAsset } from "@/types";

/** Bulanık arka plan: görsel çerçeveyi doldurmadığında boşlukları aynı görselin renkleriyle doldurur. */
export function ImageBackdrop({ image }: { image: Pick<ImageAsset, "url"> }) {
  return (
    <Image
      src={image.url}
      alt=""
      aria-hidden
      fill
      sizes="64px"
      quality={40}
      unoptimized={image.url.startsWith("blob:")}
      className="scale-125 object-cover opacity-60 blur-2xl"
    />
  );
}
