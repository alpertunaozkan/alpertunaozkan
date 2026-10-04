import type { Metadata } from "next";
import { ArticleEditorScreen } from "@/features/articles/components/admin/article-editor-screen";
import { requireAdmin } from "@/server/dal";

export const metadata: Metadata = { title: "Makaleyi Düzenle" };

/*
 * Makale, panel açılırken veritabanından yüklenen listeden id ile bulunur
 * (yeni kaydedilen makale de listeye işlendiği için ayrıca sorgulanmaz).
 * Bulunamazsa ekran "Makale bulunamadı" uyarısı gösterir.
 */
export default async function EditArticlePage({ params }: PageProps<"/admin/makaleler/[id]">) {
  await requireAdmin();
  const { id } = await params;
  return <ArticleEditorScreen articleId={id} />;
}
