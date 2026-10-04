"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { FilterChips } from "@/components/common/filter-chips";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeForSearch } from "@/lib/text";
import type { ArticleSummary, CategoryFilterOption } from "@/types";
import { ArticleCard } from "./article-card";

const ALL = "tumu";

interface ArticleExplorerProps {
  articles: ArticleSummary[];
  categories: CategoryFilterOption[];
}

/** Makale listesi: kategori filtresi + metin araması (istemci tarafında). */
export function ArticleExplorer({ articles, categories }: ArticleExplorerProps) {
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");
  // Kartlar yalnızca ziyaretçi filtreyi değiştirdiğinde animasyonla belirir;
  // ilk açılışta (LCP görseli dahil) hiçbir şey geciktirilmez.
  const [interacted, setInteracted] = useState(false);

  const normalizedQuery = normalizeForSearch(query.trim());
  const filtered = articles.filter((article) => {
    if (category !== ALL && article.category?.slug !== category) return false;
    if (!normalizedQuery) return true;
    const haystack = normalizeForSearch(
      [article.title, article.summary, article.category?.name ?? "", ...article.keywords].join(" "),
    );
    return haystack.includes(normalizedQuery);
  });

  const isFiltering = category !== ALL || normalizedQuery.length > 0;
  const [featured, ...rest] = filtered;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label="Kategoriye göre filtrele"
          value={category}
          onChange={(value) => {
            setCategory(value);
            setInteracted(true);
          }}
          options={[
            { value: ALL, label: "Tümü", count: articles.length },
            ...categories.map((item) => ({ value: item.slug, label: item.name, count: item.count })),
          ]}
        />
        <div className="relative w-full lg:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="makale-ara" className="sr-only">
            Makalelerde ara
          </label>
          <input
            id="makale-ara"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setInteracted(true);
            }}
            placeholder="Makalelerde ara…"
            className="h-10 w-full rounded-full border border-navy-900/12 bg-white pr-4 pl-10 text-sm text-navy-950 placeholder:text-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/12 focus:outline-none"
          />
        </div>
      </div>

      <p aria-live="polite" className="mt-6 text-sm text-slate-500">
        {isFiltering ? `${filtered.length} makale bulundu` : `${articles.length} makale`}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-navy-900/15 bg-white px-6 py-16 text-center motion-safe:animate-fade-in">
          <p className="font-serif text-xl text-navy-950">Aramanıza uygun makale bulunamadı.</p>
          <p className="mt-2 text-sm text-slate-600">Farklı bir kelime deneyebilir veya filtreleri temizleyebilirsiniz.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-6"
            onClick={() => {
              setCategory(ALL);
              setQuery("");
            }}
          >
            <X aria-hidden="true" />
            Filtreleri temizle
          </Button>
        </div>
      ) : (
        // Kategori değişince liste yeniden kurulur ve kartlar sırayla belirir.
        <ul key={category} className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!isFiltering && featured ? (
            <li className={cn("md:col-span-2 lg:col-span-3", interacted && "motion-safe:animate-fade-up")}>
              <ArticleCard article={featured} variant="featured" headingLevel="h2" preload />
            </li>
          ) : null}
          {(isFiltering ? filtered : rest).map((article, index) => (
            <li
              key={article.id}
              className={cn(interacted && "motion-safe:animate-fade-up")}
              style={interacted ? { animationDelay: `${Math.min(index + 1, 6) * 50}ms` } : undefined}
            >
              <ArticleCard article={article} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
