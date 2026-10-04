"use client";

import { useAdminData } from "@/features/admin/admin-data-provider";
import { unwrapAction } from "@/lib/action-result";
import type { Article, ArticleInput } from "@/types";
import { deleteArticleAction, saveArticleAction } from "../actions";

/**
 * Panel ekranlarının makale verisine ve işlemlerine eriştiği tek nokta.
 * İşlemler sunucuda (veritabanı) yapılır; başarısızlıkta ActionError fırlatır.
 */
export function useArticlesAdmin() {
  const { data, dispatch } = useAdminData();

  async function saveArticle(input: ArticleInput, existing?: Article): Promise<Article> {
    const article = unwrapAction(await saveArticleAction(input, existing?.id));
    dispatch({ type: "article/saved", article });
    return article;
  }

  async function removeArticle(id: string): Promise<void> {
    unwrapAction(await deleteArticleAction(id));
    dispatch({ type: "article/removed", id });
  }

  return {
    articles: data.articles,
    categories: data.categories,
    saveArticle,
    removeArticle,
  };
}
