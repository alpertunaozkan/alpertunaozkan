import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { FramedImage } from "@/components/common/framed-image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ArticleSummary } from "@/types";

interface ArticleCardProps {
  article: ArticleSummary;
  variant?: "default" | "featured";
  /** Ekranın ilk görünümündeki kartlar için öncelikli yükleme. */
  preload?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}

export function ArticleCard({
  article,
  variant = "default",
  preload = false,
  headingLevel: Heading = "h3",
  className,
}: ArticleCardProps) {
  const featured = variant === "featured";

  return (
    <Link
      href={`/makalelerim/${article.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-navy-900/[0.08] bg-white shadow-card transition-[box-shadow,border-color] duration-300 hover:border-gold-400/60 hover:shadow-elevated",
        featured && "md:flex-row",
        className,
      )}
    >
      {/* Kapak her oranda olabilir: yatay görsel çerçeveyi doldurur, dikey/kare görsel kırpılmadan gösterilir. */}
      <FramedImage
        image={article.coverImage}
        frameRatio={16 / 10}
        preload={preload}
        sizes={featured ? "(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"}
        className={cn("aspect-[16/10] shrink-0", featured && "md:aspect-auto md:w-1/2")}
        imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
      />

      <div className={cn("flex flex-1 flex-col p-6", featured && "md:p-8")}>
        {article.category ? (
          <Badge tone="gold" className="self-start">
            {article.category.name}
          </Badge>
        ) : null}
        <Heading
          className={cn(
            "mt-4 font-serif leading-snug font-semibold text-balance text-navy-950 transition-colors group-hover:text-navy-700",
            featured ? "text-2xl md:text-[1.75rem]" : "line-clamp-3 text-xl",
          )}
        >
          {article.title}
        </Heading>
        <p
          className={cn(
            "mt-3 text-[15px] leading-relaxed text-slate-600",
            featured ? "line-clamp-4" : "line-clamp-3",
          )}
        >
          {article.summary}
        </p>
        <ArticleMeta article={article} className="mt-auto pt-6" />
      </div>
    </Link>
  );
}

export function ArticleMeta({
  article,
  className,
}: {
  article: Pick<ArticleSummary, "publishedAt" | "updatedAt" | "readingMinutes">;
  className?: string;
}) {
  const date = article.publishedAt ?? article.updatedAt;
  return (
    <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600", className)}>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="size-4" aria-hidden="true" />
        <time dateTime={date}>{formatDate(date)}</time>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-4" aria-hidden="true" />
        {article.readingMinutes} dk okuma
      </span>
    </p>
  );
}
