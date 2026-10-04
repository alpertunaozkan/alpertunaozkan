"use client";

import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import { estimateReadingMinutes } from "@/lib/text";
import type { Category } from "@/types";
import { ArticleHero } from "../article-hero";
import type { ArticleFormValues } from "./article-form";

interface ArticlePreviewDialogProps {
  /** Önizlemenin açıldığı an (ISO); null → kapalı. Sitedeki tarih bu ana göre gösterilir. */
  openedAt: string | null;
  onClose: () => void;
  values: ArticleFormValues;
  categories: Category[];
  /** Yayındaki makalenin ilk yayın tarihi (yeni makalede yok). */
  publishedAt: string | null;
}

/**
 * Makalenin sitede nasıl görüneceğini, kaydedilmemiş değişiklikler dahil
 * gösterir. Üst bölüm (başlık, özet, kapak) sitedeki bileşenin aynısıdır;
 * içerik de sitedeki yazı stiliyle (`.prose-legal`) gösterilir.
 */
export function ArticlePreviewDialog({ openedAt, onClose, values, categories, publishedAt }: ArticlePreviewDialogProps) {
  const category = categories.find((item) => item.id === values.categoryId) ?? null;

  return (
    <Modal
      open={openedAt !== null}
      onClose={onClose}
      size="xl"
      title="Önizleme"
      description="Makalenin sitede nasıl görüneceği (kaydedilmemiş değişiklikler dahil)."
    >
      {openedAt ? (
        <div className="-mx-6 -my-5 bg-white">
          <ArticleHero
            titleAs="h2"
            article={{
              title: values.title.trim() || "Başlık henüz girilmedi",
              summary: values.summary.trim(),
              category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
              coverImage: values.coverImage,
              publishedAt: values.status === "published" ? (publishedAt ?? openedAt) : null,
              updatedAt: openedAt,
              readingMinutes: values.readingMinutes ?? estimateReadingMinutes(values.content),
            }}
          />
          <div className="px-4 py-12 sm:px-6 lg:px-16">
            <div className="mx-auto max-w-[52rem]">
              {values.content ? (
                <div className="prose-legal" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(values.content) }} />
              ) : (
                <p className="text-slate-600">İçerik henüz yazılmadı.</p>
              )}
              {values.keywords.length > 0 ? (
                <div className="mt-12 border-t border-navy-900/10 pt-8">
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">Anahtar kelimeler</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {values.keywords.map((keyword) => (
                      <li key={keyword}>
                        <Badge tone="outline" className="px-3 py-1 text-left text-[13px] whitespace-normal">
                          {keyword}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
