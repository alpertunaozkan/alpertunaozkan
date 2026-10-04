import type { CategoryRef } from "./category";
import type { ImageAsset, ISODateString } from "./common";

export type ArticleStatus = "published" | "draft";

export interface Article {
  id: string;
  /** URL parçası: /makalelerim/[slug]. Canlı sitedeki slug'lar korunmuştur. */
  slug: string;
  title: string;
  /** Liste kartlarında ve meta description'da kullanılan kısa özet. */
  summary: string;
  /** Editörden gelen HTML içerik (h2/h3, p, ul/ol, strong, em, a). */
  content: string;
  coverImage: ImageAsset;
  category: CategoryRef | null;
  keywords: string[];
  readingMinutes: number;
  status: ArticleStatus;
  /** Taslaklarda null. */
  publishedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Listelerde içerik gövdesi taşınmaz (daha hafif payload). */
export type ArticleSummary = Omit<Article, "content">;

/** Panel formunun ürettiği ve sunucuya (Server Action) gönderilen gövde. */
export interface ArticleInput {
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: ImageAsset;
  categoryId: string | null;
  keywords: string[];
  readingMinutes: number;
  status: ArticleStatus;
}
