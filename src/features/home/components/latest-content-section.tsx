import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, FileText, PlayCircle } from "lucide-react";
import { Container } from "@/components/common/container";
import { Section, SectionHeading } from "@/components/common/section";
import { Badge } from "@/components/ui/badge";
import { ArticleCard } from "@/features/articles/components/article-card";
import { VideoThumbnail } from "@/features/videos/components/video-thumbnail";
import { formatDate } from "@/lib/format";
import type { ArticleSummary, Video } from "@/types";

interface LatestContentSectionProps {
  articles: ArticleSummary[];
  videos: Video[];
}

/** Eski sitedeki "Hukuki İçerik ve Analizler" bölümü. */
export function LatestContentSection({ articles, videos }: LatestContentSectionProps) {
  const [featured, ...rest] = articles;

  return (
    <Section tone="cream" aria-labelledby="hukuki-icerik">
      <Container>
        <SectionHeading
          id="hukuki-icerik"
          align="center"
          eyebrow="Makaleler ve Videolar"
          title="Hukuki İçerik ve Analizler"
          description="Hukuki gelişmeler ve pratik çözümler hakkında uzman perspektifiyle hazırlanmış içeriklere erişin."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-8">
            <ColumnHeader icon={<FileText aria-hidden="true" />} title="Son Makalelerim" href="/makalelerim" linkLabel="Tüm Makaleleri Oku" />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {featured ? <ArticleCard article={featured} variant="featured" className="md:col-span-2" /> : null}
              {rest.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>

          <div className="min-w-0 lg:col-span-4">
            <ColumnHeader icon={<PlayCircle aria-hidden="true" />} title="Son Videolarım" href="/videolarim" linkLabel="Tüm Videoları İzle" />
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {videos.map((video) => (
                <li key={video.id}>
                  <Link
                    href={`/videolarim#${video.id}`}
                    className="group block overflow-hidden rounded-2xl border border-navy-900/[0.08] bg-white shadow-card transition-[box-shadow,border-color] duration-300 hover:border-gold-400/60 hover:shadow-elevated"
                  >
                    <VideoThumbnail video={video} sizes="(min-width: 1024px) 28vw, (min-width: 640px) 50vw, 100vw" />
                    <div className="p-5">
                      {video.category ? <Badge tone="gold">{video.category.name}</Badge> : null}
                      <h3 className="mt-3 line-clamp-2 font-serif text-lg leading-snug font-semibold text-navy-950 group-hover:text-navy-700">
                        {video.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function ColumnHeader({
  icon,
  title,
  href,
  linkLabel,
}: {
  icon: ReactNode;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-900/10 pb-4">
      <h3 className="flex items-center gap-2.5 text-lg font-semibold text-navy-950 [&_svg]:size-5 [&_svg]:text-gold-600">
        {icon}
        {title}
      </h3>
      <Link
        href={href}
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-navy-600"
      >
        {linkLabel}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
