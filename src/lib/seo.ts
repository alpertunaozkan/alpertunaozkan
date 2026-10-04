import type { Metadata } from "next";
import { SITE } from "@/constants/site";

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, `${SITE.url}/`).toString();
}

type SocialImage = { url: string; alt?: string; width?: number; height?: number };

/** Paylaşım görselinin en uzun kenarı (Facebook/LinkedIn/X için yeterli, WhatsApp için küçük). */
const SOCIAL_IMAGE_MAX = 1200;

/**
 * Paylaşım önizlemesi (Open Graph/Twitter) için görsel. Cloudinary'deki
 * orijinal dosya (ör. 5000+ px, birkaç MB) verilirse WhatsApp gibi
 * uygulamalar önizleme göstermez; bu yüzden görsel kırpılmadan en fazla
 * 1200 px'e küçültülmüş JPEG olarak istenir ve boyutları buna göre bildirilir.
 */
export function socialImage(image: SocialImage): SocialImage {
  const match = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/.exec(image.url);
  if (!match) return image;
  const { width, height } = image;
  const scale = width && height ? Math.min(1, SOCIAL_IMAGE_MAX / width, SOCIAL_IMAGE_MAX / height) : null;
  return {
    ...image,
    url: `${match[1]}c_limit,w_${SOCIAL_IMAGE_MAX},h_${SOCIAL_IMAGE_MAX},f_jpg,q_auto/${match[2]}`,
    ...(width && height && scale ? { width: Math.round(width * scale), height: Math.round(height * scale) } : {}),
  };
}

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  /** Sosyal paylaşımlarda farklı açıklama gösterilecekse. */
  socialDescription?: string;
  image?: SocialImage;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
}

/** Sayfa bazında tutarlı canonical + Open Graph + Twitter metadata üretir. */
export function buildPageMetadata({
  title,
  description,
  path,
  socialDescription,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
}: PageMetadataOptions): Metadata {
  // Makale kapakları her oranda olabilir (dikey, kare, panoramik); boyut
  // bilinmiyorsa yanlış oran bildirmek yerine hiç yazılmaz.
  const shared = image ? socialImage(image) : undefined;
  const ogImage = shared
    ? {
        url: shared.url,
        ...(shared.width && shared.height ? { width: shared.width, height: shared.height } : {}),
        alt: shared.alt ?? SITE.name,
      }
    : { url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name };

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      title,
      description: socialDescription ?? description,
      siteName: SITE.name,
      locale: SITE.locale,
      images: [ogImage],
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: socialDescription ?? description,
      images: [ogImage.url],
      site: SITE.twitterHandle,
      creator: SITE.twitterHandle,
    },
  };
}
