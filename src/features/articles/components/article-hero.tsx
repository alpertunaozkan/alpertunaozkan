import Image from "next/image";
import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Container } from "@/components/common/container";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ArticleSummary } from "@/types";
import { ArticleMeta } from "./article-card";
import { ArticleCover } from "./article-cover";

type HeroArticle = Pick<
  ArticleSummary,
  "title" | "summary" | "category" | "coverImage" | "publishedAt" | "updatedAt" | "readingMinutes"
>;

interface ArticleHeroProps {
  article: HeroArticle;
  /** Başlığın id'si (makalenin aria-labelledby bağlantısı için). */
  titleId?: string;
  /** Sitede h1; paneldeki önizlemede (sayfanın kendi h1'i olduğu için) h2. */
  titleAs?: "h1" | "h2";
  /** Başlığın üstündeki konum çubuğu (önizlemede gösterilmez). */
  breadcrumbs?: ReactNode;
  preloadCover?: boolean;
}

/**
 * Makale sayfasının üst bölümü: kategori, başlık, özet, yazar/tarih satırı ve
 * kapak görseli. Hem public makale sayfası hem de paneldeki önizleme bu
 * bileşeni kullanır; böylece önizleme sitedeki görünümle birebir aynıdır.
 */
export function ArticleHero({ article, titleId, titleAs: Title = "h1", breadcrumbs, preloadCover = false }: ArticleHeroProps) {
  const hasCover = Boolean(article.coverImage.url);
  const wasUpdated =
    article.publishedAt !== null && article.updatedAt.slice(0, 10) !== article.publishedAt.slice(0, 10);

  return (
    <>
      <header
        className={cn(
          "border-b border-navy-900/[0.06] bg-cream-100",
          hasCover ? "pb-40 sm:pb-48 lg:pb-56" : "pb-12 sm:pb-16",
        )}
      >
        <Container size="narrow" className="pt-10 sm:pt-12">
          {breadcrumbs}
          {article.category ? (
            <div className={cn("flex flex-wrap items-center gap-3", breadcrumbs ? "mt-8" : null)}>
              <Badge tone="gold">{article.category.name}</Badge>
            </div>
          ) : null}
          <Title
            id={titleId}
            className="mt-5 font-serif text-3xl leading-[1.15] font-semibold tracking-tight text-balance text-navy-950 sm:text-4xl lg:text-5xl"
          >
            {article.title}
          </Title>
          {article.summary ? <p className="mt-5 text-lg leading-relaxed text-slate-600">{article.summary}</p> : null}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <div className="relative size-10 overflow-hidden rounded-full bg-navy-100 ring-2 ring-gold-400/50">
                <Image
                  src="/images/profile/alper-tuna-ozkan-portre.webp"
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover object-top"
                />
              </div>
              <span className="text-sm font-semibold text-navy-950">Av. Alper Tuna Özkan</span>
            </div>
            <ArticleMeta article={article} />
            {wasUpdated ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                <RefreshCw className="size-4" aria-hidden="true" />
                Güncellendi: <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time>
              </span>
            ) : null}
          </div>
        </Container>
      </header>

      {hasCover ? (
        <Container className="-mt-32 sm:-mt-40 lg:-mt-48">
          <ArticleCover image={article.coverImage} preload={preloadCover} />
        </Container>
      ) : null}
    </>
  );
}
