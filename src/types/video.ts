import type { CategoryRef } from "./category";
import type { ImageAsset, ISODateString } from "./common";

export interface Video {
  id: string;
  title: string;
  /** YouTube video kimliği (11 karakter). */
  youtubeId: string;
  description: string;
  /** YouTube'daki videonun kendi kapak görseli; video eklenirken otomatik alınır. */
  coverImage: ImageAsset;
  category: CategoryRef | null;
  durationSeconds: number | null;
  /** Aynı konuyu işleyen makale varsa slug'ı. */
  relatedArticleSlug: string | null;
  publishedAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Panelden gönderilen video bilgisi. Kapak görseli gönderilmez; YouTube ID'sinden belirlenir. */
export interface VideoInput {
  title: string;
  youtubeId: string;
  description: string;
  categoryId: string | null;
  durationSeconds: number | null;
  relatedArticleSlug: string | null;
}
