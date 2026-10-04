import type { ISODateString } from "./common";

export interface CategoryContentCount {
  categoryId: string;
  name: string;
  articles: number;
  videos: number;
}

/** Panel ana sayfasındaki özet metrikler. */
export interface DashboardStats {
  articles: { total: number; published: number; drafts: number };
  videos: { total: number; totalDurationSeconds: number };
  categories: { total: number };
  messages: { total: number; unread: number; archived: number };
  /** Kategori başına içerik sayısı; en son eklenen kategori önce. */
  contentByCategory: CategoryContentCount[];
  lastMessageAt: ISODateString | null;
}
