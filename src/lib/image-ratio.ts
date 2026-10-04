import type { ImageAsset } from "@/types";

/**
 * Görsel ile çerçeve oranı arasındaki fark bu katsayının altındaysa görsel
 * çerçeveyi doldurur (kenarlardan en fazla ~%10 kırpılır). Daha farklı
 * oranlarda (dikey, kare, panoramik) görselin tamamı gösterilir.
 */
const FILL_TOLERANCE = 1.2;

/** Görselin en/boy oranı; boyutlar bilinmiyorsa null. */
export function imageRatio(image: Pick<ImageAsset, "width" | "height">): number | null {
  return image.width && image.height ? image.width / image.height : null;
}

/** Görselin ilgili çerçeveyi kırpmadan doldurup dolduramayacağı. */
export function fitsFrame(image: Pick<ImageAsset, "width" | "height">, frameRatio: number): boolean {
  const ratio = imageRatio(image);
  return ratio !== null && Math.max(ratio / frameRatio, frameRatio / ratio) <= FILL_TOLERANCE;
}
