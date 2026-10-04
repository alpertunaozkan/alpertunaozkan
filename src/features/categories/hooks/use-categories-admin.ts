"use client";

import { useAdminData } from "@/features/admin/admin-data-provider";
import { unwrapAction } from "@/lib/action-result";
import type { Category, CategoryInput } from "@/types";
import { deleteCategoryAction, saveCategoryAction } from "../actions";

export interface CategoryWithUsage extends Category {
  articleCount: number;
  videoCount: number;
}

/**
 * Panel ekranlarının kategori verisine ve işlemlerine eriştiği tek nokta.
 * İşlemler sunucuda yapılır; başarısızlıkta ActionError fırlatır.
 */
export function useCategoriesAdmin() {
  const { data, dispatch } = useAdminData();

  const categories: CategoryWithUsage[] = [...data.categories]
    .sort((a, b) => a.name.localeCompare(b.name, "tr"))
    .map((category) => ({
      ...category,
      articleCount: data.articles.filter((article) => article.category?.id === category.id).length,
      videoCount: data.videos.filter((video) => video.category?.id === category.id).length,
    }));

  async function saveCategory(input: CategoryInput, existing?: Category): Promise<Category> {
    const category = unwrapAction(await saveCategoryAction(input, existing?.id));
    dispatch({ type: "category/saved", category });
    return category;
  }

  async function removeCategory(id: string): Promise<void> {
    unwrapAction(await deleteCategoryAction(id));
    dispatch({ type: "category/removed", id });
  }

  return { categories, saveCategory, removeCategory };
}
