import type { Metadata } from "next";
import { ArticlesScreen } from "@/features/articles/components/admin/articles-screen";
import { getArticleViewCounts } from "@/features/articles/queries";
import { requireAdmin } from "@/server/dal";

export const metadata: Metadata = { title: "Makaleler" };

export default async function AdminArticlesPage() {
  await requireAdmin();
  const viewCounts = await getArticleViewCounts();
  return <ArticlesScreen viewCounts={viewCounts} />;
}
