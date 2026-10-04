import type { Metadata } from "next";
import { ArticleEditorScreen } from "@/features/articles/components/admin/article-editor-screen";
import { requireAdmin } from "@/server/dal";

export const metadata: Metadata = { title: "Yeni Makale" };

export default async function NewArticlePage() {
  await requireAdmin();
  return <ArticleEditorScreen />;
}
