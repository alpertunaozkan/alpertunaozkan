"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Pencil, Plus, Search, SearchX, Trash2 } from "lucide-react";
import { AdminPageHeader, ArticleStatusBadge, EmptyState } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FramedImage } from "@/components/common/framed-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/action-result";
import { formatCount, formatShortDate } from "@/lib/format";
import { normalizeForSearch } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { Article, ArticleStatus, ArticleViewCounts } from "@/types";
import { useArticlesAdmin } from "../../hooks/use-articles-admin";

type StatusFilter = "all" | ArticleStatus;

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Tümü" },
  { value: "published", label: "Yayında" },
  { value: "draft", label: "Taslak" },
];

export function ArticlesScreen({ viewCounts }: { viewCounts: ArticleViewCounts }) {
  const { notify } = useToast();
  const { articles, categories, removeArticle } = useArticlesAdmin();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts: Record<StatusFilter, number> = {
    all: articles.length,
    published: articles.filter((article) => article.status === "published").length,
    draft: articles.filter((article) => article.status === "draft").length,
  };

  const needle = normalizeForSearch(query.trim());
  const visible = [...articles]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((article) => status === "all" || article.status === status)
    .filter((article) => categoryId === "all" || (categoryId === "none" ? !article.category : article.category?.id === categoryId))
    .filter((article) => !needle || normalizeForSearch(`${article.title} ${article.slug} ${article.keywords.join(" ")}`).includes(needle));

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeArticle(pendingDelete.id);
      notify({ tone: "success", title: "Makale silindi" });
      setPendingDelete(null);
    } catch (error) {
      notify({ tone: "error", title: "Makale silinemedi", description: errorMessage(error) });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Makaleler"
        description="Sitede yayınlanan yazıları ve taslakları yönetin."
        actions={
          <ButtonLink href="/admin/makaleler/yeni">
            <Plus aria-hidden="true" />
            Yeni Makale
          </ButtonLink>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-navy-900/[0.07] p-4 xl:flex-row xl:items-center xl:justify-between">
          <div role="group" aria-label="Duruma göre filtrele" className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={status === filter.value}
                onClick={() => setStatus(filter.value)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-3 xl:flex-none",
                  status === filter.value ? "bg-white text-navy-950 shadow-xs" : "text-slate-600 hover:text-navy-950",
                )}
              >
                {filter.label}
                <span className="ml-1 text-xs text-slate-500 tabular-nums sm:ml-1.5">{counts[filter.value]}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="articles-category" className="sr-only">
              Kategori
            </label>
            <Select
              id="articles-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              wrapperClassName="sm:w-52"
              className="h-10 text-sm"
            >
              <option value="all">Tüm kategoriler</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value="none">Kategorisiz</option>
            </Select>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <label htmlFor="articles-search" className="sr-only">
                Makale ara
              </label>
              <Input
                id="articles-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Başlık, adres veya anahtar kelime"
                className="h-10 pl-9 text-sm"
              />
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title={articles.length === 0 ? "Henüz makale yok" : "Filtreye uygun makale bulunamadı"}
            description={articles.length === 0 ? "İlk makalenizi oluşturarak başlayın." : "Filtreleri değiştirip tekrar deneyin."}
            action={
              articles.length === 0 ? (
                <ButtonLink href="/admin/makaleler/yeni" size="sm">
                  <Plus aria-hidden="true" />
                  Yeni Makale
                </ButtonLink>
              ) : null
            }
          />
        ) : (
          <>
            {/* Dar ekranlarda kategori ve tarih başlığın altında gösterilir; tablo sayfayı taşırmaz. */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Makale listesi</caption>
                <thead className="border-b border-navy-900/[0.07] text-xs tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Makale</th>
                    <th scope="col" className="hidden px-3 py-3 font-medium xl:table-cell">Kategori</th>
                    <th scope="col" className="px-3 py-3 font-medium">Durum</th>
                    <th scope="col" className="px-3 py-3 text-right font-medium">Görüntülenme</th>
                    <th scope="col" className="hidden px-3 py-3 font-medium xl:table-cell">Güncelleme</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      <span className="sr-only">İşlemler</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-900/[0.06]">
                  {visible.map((article) => (
                    <tr key={article.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Thumbnail article={article} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/makaleler/${article.id}`}
                              className="line-clamp-1 font-semibold text-navy-950 hover:text-navy-700 hover:underline"
                            >
                              {article.title}
                            </Link>
                            <p className="line-clamp-1 text-xs text-slate-500">/makalelerim/{article.slug}</p>
                            <p className="mt-0.5 text-xs text-slate-600 xl:hidden">
                              {article.category?.name ?? "Kategorisiz"} · {formatShortDate(article.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3 whitespace-nowrap text-slate-600 xl:table-cell">{article.category?.name ?? "—"}</td>
                      <td className="px-3 py-3">
                        <ArticleStatusBadge status={article.status} />
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap text-slate-600 tabular-nums">
                        {formatCount(viewCounts[article.id] ?? 0)}
                      </td>
                      <td className="hidden px-3 py-3 whitespace-nowrap text-slate-600 xl:table-cell">{formatShortDate(article.updatedAt)}</td>
                      <td className="px-5 py-3">
                        <RowActions article={article} onDelete={() => setPendingDelete(article)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-navy-900/[0.06] md:hidden">
              {visible.map((article) => (
                <li key={article.id} className="flex gap-3 p-4">
                  <Thumbnail article={article} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/makaleler/${article.id}`} className="line-clamp-2 text-sm font-semibold text-navy-950">
                      {article.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <ArticleStatusBadge status={article.status} />
                      <span>{article.category?.name ?? "Kategorisiz"}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatShortDate(article.updatedAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatCount(viewCounts[article.id] ?? 0)} görüntülenme</span>
                    </div>
                    <RowActions article={article} onDelete={() => setPendingDelete(article)} className="mt-2 justify-start" />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Makale silinsin mi?"
        description={pendingDelete ? `“${pendingDelete.title}” kalıcı olarak silinecek. Bu işlem geri alınamaz.` : undefined}
        pending={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function Thumbnail({ article }: { article: Article }) {
  return (
    <span className="relative hidden h-10 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:block">
      {article.coverImage.url ? (
        <FramedImage image={{ ...article.coverImage, alt: "" }} frameRatio={16 / 10} sizes="64px" className="absolute inset-0" />
      ) : null}
    </span>
  );
}

function RowActions({ article, onDelete, className }: { article: Article; onDelete: () => void; className?: string }) {
  return (
    <div className={cn("flex items-center justify-end gap-1", className)}>
      {article.status === "published" ? (
        <ButtonLink
          href={`/makalelerim/${article.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          size="icon-sm"
          aria-label={`${article.title} — sitede görüntüle`}
          title="Sitede görüntüle"
        >
          <ExternalLink aria-hidden="true" />
        </ButtonLink>
      ) : null}
      <ButtonLink
        href={`/admin/makaleler/${article.id}`}
        variant="ghost"
        size="icon-sm"
        aria-label={`${article.title} — düzenle`}
        title="Düzenle"
      >
        <Pencil aria-hidden="true" />
      </ButtonLink>
      <Button variant="danger-ghost" size="icon-sm" onClick={onDelete} aria-label={`${article.title} — sil`} title="Sil">
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}
