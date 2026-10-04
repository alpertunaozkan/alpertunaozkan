import type { Metadata } from "next";
import { ArticlesScreen } from "@/features/articles/components/admin/articles-screen";
import { requireAdmin } from "@/server/dal";

export const metadata: Metadata = { title: "Makaleler" };

export default async function AdminArticlesPage() {
  await requireAdmin();
  return <ArticlesScreen />;
}
