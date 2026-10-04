"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { FilterChips } from "@/components/common/filter-chips";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { youtubeEmbedUrl, youtubeWatchUrl } from "@/lib/youtube";
import type { CategoryFilterOption, Video } from "@/types";
import { VideoThumbnail } from "./video-thumbnail";

const ALL = "tumu";

interface VideoGalleryProps {
  videos: Video[];
  categories: CategoryFilterOption[];
}

/**
 * Video listesi + oynatıcı. Sayfa yüklenirken YouTube'a hiçbir istek
 * gönderilmez; gizlilik odaklı (youtube-nocookie) oynatıcı yalnızca ziyaretçi
 * bir videoyu açtığında yüklenir.
 */
export function VideoGallery({ videos, categories }: VideoGalleryProps) {
  const [category, setCategory] = useState(ALL);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Kartlar yalnızca filtre değiştiğinde animasyonla belirir (ilk açılışta değil).
  const [interacted, setInteracted] = useState(false);

  const visible = category === ALL ? videos : videos.filter((video) => video.category?.slug === category);
  const active = videos.find((video) => video.id === activeId) ?? null;

  return (
    <>
      {categories.length > 1 ? (
        <FilterChips
          label="Kategoriye göre filtrele"
          value={category}
          onChange={(value) => {
            setCategory(value);
            setInteracted(true);
          }}
          options={[
            { value: ALL, label: "Tümü", count: videos.length },
            ...categories.map((item) => ({ value: item.slug, label: item.name, count: item.count })),
          ]}
        />
      ) : null}

      <ul key={category} className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((video, index) => (
          <li
            key={video.id}
            id={video.id}
            className={cn(interacted && "motion-safe:animate-fade-up")}
            style={interacted ? { animationDelay: `${Math.min(index, 5) * 50}ms` } : undefined}
          >
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-navy-900/[0.08] bg-white shadow-card">
              <button
                type="button"
                onClick={() => setActiveId(video.id)}
                className="group block w-full cursor-pointer text-left"
                aria-label={`Videoyu izle: ${video.title}${video.durationSeconds ? ` (${formatDuration(video.durationSeconds)})` : ""}`}
              >
                <VideoThumbnail
                  video={video}
                  preload={index === 0}
                  sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                />
              </button>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {video.category ? <Badge tone="gold">{video.category.name}</Badge> : null}
                  <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
                </div>
                <h2 className="mt-4 font-serif text-xl leading-snug font-semibold text-balance text-navy-950">
                  {video.title}
                </h2>
                {video.description ? (
                  <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-slate-600">{video.description}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-6">
                  <button
                    type="button"
                    onClick={() => setActiveId(video.id)}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-navy-600"
                  >
                    Videoyu izle
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                  {video.relatedArticleSlug ? (
                    <Link
                      href={`/makalelerim/${video.relatedArticleSlug}`}
                      className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-navy-900 hover:underline"
                    >
                      İlgili makaleyi oku
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <Modal
        open={active !== null}
        onClose={() => setActiveId(null)}
        size="xl"
        title={active?.title ?? ""}
        description={active ? `${active.category?.name ?? "Video"} · ${formatDate(active.publishedAt)}` : undefined}
        footer={
          active ? (
            <ButtonLink href={youtubeWatchUrl(active.youtubeId)} target="_blank" rel="noopener noreferrer" variant="outline" size="sm">
              YouTube’da izle
              <ArrowUpRight aria-hidden="true" />
            </ButtonLink>
          ) : null
        }
      >
        {active ? (
          <div>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-navy-950">
              <iframe
                key={active.youtubeId}
                src={youtubeEmbedUrl(active.youtubeId)}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-slate-600">{active.description}</p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
