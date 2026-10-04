"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileQuestion } from "lucide-react";
import { AdminPageHeader, EmptyState } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/action-result";
import { useArticlesAdmin } from "../../hooks/use-articles-admin";
import { ArticleForm, EMPTY_ARTICLE_VALUES, articleToFormValues } from "./article-form";

/**
 * Makale oluşturma/düzenleme ekranı. Veriyi ve işlemleri useArticlesAdmin
 * hook'undan alır; ArticleForm yalnızca form durumunu ve doğrulamayı yönetir.
 */
export function ArticleEditorScreen({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const { articles, categories, saveArticle, removeArticle } = useArticlesAdmin();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const article = articleId ? articles.find((item) => item.id === articleId) : undefined;

  if (leaving) return null;

  if (articleId && !article) {
    return (
      <>
        <AdminPageHeader title="Makale bulunamadı" back={{ href: "/admin/makaleler", label: "Makalelere dön" }} />
        <Card>
          <EmptyState
            icon={<FileQuestion />}
            title="Bu makale bulunamadı"
            description="Makale silinmiş ya da adresi değişmiş olabilir."
            action={<ButtonLink href="/admin/makaleler">Makalelere dön</ButtonLink>}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <ArticleForm
        key={article?.id ?? "yeni"}
        article={article}
        initialValues={article ? articleToFormValues(article) : EMPTY_ARTICLE_VALUES}
        categories={categories}
        takenSlugs={articles.filter((item) => item.id !== article?.id).map((item) => item.slug)}
        onSubmit={async (input) => {
          const saved = await saveArticle(input, article);
          notify({
            tone: "success",
            title: article ? "Makale güncellendi" : saved.status === "published" ? "Makale yayınlandı" : "Taslak kaydedildi",
          });
          router.push("/admin/makaleler");
        }}
        onDelete={article ? () => setConfirmingDelete(true) : undefined}
      />

      {article ? (
        <ConfirmDialog
          open={confirmingDelete}
          title="Makale silinsin mi?"
          description={`“${article.title}” kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            try {
              await removeArticle(article.id);
            } catch (error) {
              setConfirmingDelete(false);
              notify({ tone: "error", title: "Makale silinemedi", description: errorMessage(error) });
              return;
            }
            setLeaving(true);
            notify({ tone: "success", title: "Makale silindi" });
            router.push("/admin/makaleler");
          }}
        />
      ) : null}
    </>
  );
}
