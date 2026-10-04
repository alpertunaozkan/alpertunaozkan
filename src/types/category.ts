import type { ISODateString } from "./common";

/** Makale ve videoların ortak kullandığı kategori. */
export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** İçeriklerin içinde taşınan hafif kategori referansı. */
export type CategoryRef = Pick<Category, "id" | "name" | "slug">;

export interface CategoryInput {
  name: string;
}

/** Public filtrelerde kullanılan, içerik sayısıyla birlikte kategori. */
export interface CategoryFilterOption extends CategoryRef {
  count: number;
}
