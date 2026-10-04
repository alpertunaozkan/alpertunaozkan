import "server-only";

import { getArticlesForAdmin } from "@/features/articles/queries";
import { getCategories } from "@/features/categories/queries";
import { getContactMessages } from "@/features/contacts/queries";
import { getVideosForAdmin } from "@/features/videos/queries";
import { requireAdmin } from "@/server/dal";
import type { DashboardStats } from "@/types";
import { computeDashboardStats } from "./stats";

/** Panel özet metrikleri (aynı istekteki panel sorgularını yeniden kullanır). */
export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();
  const [articles, videos, categories, contacts] = await Promise.all([
    getArticlesForAdmin(),
    getVideosForAdmin(),
    getCategories(),
    getContactMessages(),
  ]);
  return computeDashboardStats({ articles, videos, categories, contacts });
}
