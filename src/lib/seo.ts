import type { Metadata } from "next";
import { SITE } from "@/constants/site";

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, `${SITE.url}/`).toString();
}

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  /** Sosyal paylaşımlarda farklı açıklama gösterilecekse. */
  socialDescription?: string;
  image?: { url: string; alt?: string; width?: number; height?: number };
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
  const ogImage = image
    ? {
        url: image.url,
        ...(image.width && image.height ? { width: image.width, height: image.height } : {}),
        alt: image.alt ?? SITE.name,
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
