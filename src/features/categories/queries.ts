import "server-only";

import { cache } from "react";
import type { Collection, ObjectId } from "mongodb";
import { getCollections } from "@/server/db";
import { loadCategoryRefs, toCategory, type CategoryRefs } from "@/server/mappers";
import type { Category, CategoryFilterOption } from "@/types";

/*
 * Kategori okuma katmanı (MongoDB). Kategori adları herkese açık bilgidir.
 */

export const getCategories = cache(async (): Promise<Category[]> => {
  const c = await getCollections();
  const docs = await c.categories.find({}).toArray();
  return docs.map(toCategory).sort((a, b) => a.name.localeCompare(b.name, "tr"));
});

async function countByCategory<T extends { categoryId: ObjectId | null }>(
  collection: Collection<T>,
  filter: Record<string, unknown>,
  refs: CategoryRefs,
): Promise<CategoryFilterOption[]> {
  const groups = await collection
    .aggregate<{ _id: ObjectId; count: number }>([
      { $match: { ...filter, categoryId: { $ne: null } } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ])
    .toArray();

  return groups
    .flatMap(({ _id, count }) => {
      const category = refs.get(_id.toHexString());
      return category ? [{ ...category, count }] : [];
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr"));
}

/** Public filtreler: yalnızca yayında makalesi olan kategoriler. */
export async function getArticleCategoryFilters(): Promise<CategoryFilterOption[]> {
  const c = await getCollections();
  return countByCategory(c.articles, { status: "published" }, await loadCategoryRefs(c));
}

export async function getVideoCategoryFilters(): Promise<CategoryFilterOption[]> {
  const c = await getCollections();
  return countByCategory(c.videos, {}, await loadCategoryRefs(c));
}
