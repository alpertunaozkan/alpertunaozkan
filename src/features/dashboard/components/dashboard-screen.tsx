"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Clapperboard, FolderTree, Inbox, Newspaper, PencilLine } from "lucide-react";
import { AdminPageHeader, ArticleStatusBadge, EmptyState } from "@/components/admin/admin-ui";
import { FramedImage } from "@/components/common/framed-image";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminData } from "@/features/admin/admin-data-provider";
import { VideoCover } from "@/features/videos/components/video-thumbnail";
import { formatDuration, formatDurationLong, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import { computeDashboardStats } from "../stats";

/** Genel Bakış listelerinde gösterilen kayıt sayısı. */
const RECENT_LIMIT = 5;

export function DashboardScreen({ serverStats }: { serverStats: DashboardStats }) {
  const { data, isPristine } = useAdminData();

  // Özet sunucudan gelir; bu oturumda değişiklik yapıldıysa aynı hesaplama
  // paneldeki güncel veriden tekrarlanır (sayfa yenilenmeden doğru kalır).
  const stats = isPristine ? serverStats : computeDashboardStats(data);

  const recentMessages = [...data.contacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, RECENT_LIMIT);
  const recentArticles = [...data.articles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, RECENT_LIMIT);
  const recentVideos = [...data.videos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, RECENT_LIMIT);
  const recentCategories = stats.contentByCategory.slice(0, RECENT_LIMIT);
  const maxCategoryTotal = Math.max(1, ...recentCategories.map((item) => item.articles + item.videos));

  return (
    <>
      <AdminPageHeader title="Genel Bakış" description="Hoş geldiniz, Av. Alper Tuna Özkan." />

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          href="/admin/makaleler"
          icon={<Newspaper />}
          label="Yayındaki makaleler"
          value={stats.articles.published}
          detail={`${stats.articles.drafts} taslak`}
        />
        <StatTile
          href="/admin/videolar"
          icon={<Clapperboard />}
          label="Videolar"
          value={stats.videos.total}
          detail={
            // Eski sistemden aktarılan videolarda süre bilgisi yoktur; bilinmeyen süre "0 dk" gösterilmez.
            stats.videos.totalDurationSeconds > 0
              ? `Toplam ${formatDurationLong(stats.videos.totalDurationSeconds)} içerik`
              : "Sitede yayında"
          }
        />
        <StatTile
          href="/admin/kategoriler"
          icon={<FolderTree />}
          label="Kategoriler"
          value={stats.categories.total}
          detail="Makale ve videolar için"
        />
        <StatTile
          href="/admin/iletisim"
          icon={<Inbox />}
          label="Okunmamış mesajlar"
          value={stats.messages.unread}
          detail={`Toplam ${stats.messages.total} mesaj`}
          highlight={stats.messages.unread > 0}
        />
      </ul>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Hızlı işlemler</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction href="/admin/makaleler/yeni" icon={<PencilLine />} label="Makale yaz" />
          <QuickAction href="/admin/videolar?yeni=1" icon={<Clapperboard />} label="Video ekle" />
          <QuickAction href="/admin/kategoriler" icon={<FolderTree />} label="Kategorileri düzenle" />
          <QuickAction href="/admin/iletisim" icon={<Inbox />} label="Mesajları görüntüle" />
        </CardBody>
      </Card>

      {/*
        İki bağımsız sütun: her kart içeriği kadar yer kaplar, uzamaz; kısa
        kartın altındaki boşluğu aynı sütundaki sıradaki kart doldurur.
      */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <div className="grid min-w-0 gap-6">
          <Card>
            <ListCardHeader
              title="Son mesajlar"
              description={stats.messages.unread > 0 ? `${stats.messages.unread} okunmamış mesaj` : "Tüm mesajlar okundu"}
              href="/admin/iletisim"
              linkContext="mesajlar"
            />
            {recentMessages.length === 0 ? (
              <EmptyState icon={<Inbox />} title="Henüz mesaj yok" className="py-10" />
            ) : (
              <ul className="divide-y divide-navy-900/[0.06]">
                {recentMessages.map((message) => {
                  const unread = message.status === "unread";
                  return (
                    <li key={message.id}>
                      <Link
                        href={`/admin/iletisim?mesaj=${message.id}`}
                        className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                      >
                        <span
                          className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread ? "bg-gold-500" : "bg-transparent")}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <p className={cn("truncate text-sm", unread ? "font-semibold text-navy-950" : "font-medium text-slate-700")}>
                              {message.name}
                              {unread ? <span className="sr-only"> (okunmadı)</span> : null}
                            </p>
                            <time dateTime={message.createdAt} className="shrink-0 text-xs text-slate-500">
                              {formatShortDate(message.createdAt)}
                            </time>
                          </div>
                          <p className="mt-0.5 truncate text-sm text-slate-600">{message.subject}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <ListCardHeader
              title="Son makaleler"
              description="En son güncellenenler"
              href="/admin/makaleler"
              linkContext="makaleler"
            />
            {recentArticles.length === 0 ? (
              <EmptyState icon={<Newspaper />} title="Henüz makale yok" className="py-10" />
            ) : (
              <ul className="divide-y divide-navy-900/[0.06]">
                {recentArticles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/admin/makaleler/${article.id}`}
                      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                    >
                      <span className="relative aspect-[16/10] w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                        {article.coverImage.url ? (
                          <FramedImage
                            image={{ ...article.coverImage, alt: "" }}
                            frameRatio={16 / 10}
                            sizes="64px"
                            className="absolute inset-0"
                          />
                        ) : (
                          <Newspaper className="absolute inset-0 m-auto size-4 text-slate-400" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-navy-950 group-hover:text-navy-700">{article.title}</p>
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <ArticleStatusBadge status={article.status} />
                          <p className="truncate text-xs text-slate-500">
                            {formatShortDate(article.updatedAt)} · {article.category?.name ?? "Kategorisiz"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid min-w-0 gap-6">
          <Card>
            <ListCardHeader
              title="Son videolar"
              description="En son güncellenenler"
              href="/admin/videolar"
              linkContext="videolar"
            />
            {recentVideos.length === 0 ? (
              <EmptyState icon={<Clapperboard />} title="Henüz video yok" className="py-10" />
            ) : (
              <ul className="divide-y divide-navy-900/[0.06]">
                {recentVideos.map((video) => (
                  <li key={video.id}>
                    <Link
                      href={`/admin/videolar?duzenle=${video.id}`}
                      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                    >
                      <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-navy-900">
                        <VideoCover image={{ ...video.coverImage, alt: "" }} sizes="80px" className="absolute inset-0" />
                        {video.durationSeconds ? (
                          <span className="absolute right-1 bottom-1 rounded bg-navy-950/80 px-1 text-[10px] leading-4 font-medium text-white tabular-nums">
                            <span className="sr-only">Süre: </span>
                            {formatDuration(video.durationSeconds)}
                          </span>
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-navy-950 group-hover:text-navy-700">{video.title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {formatShortDate(video.updatedAt)} · {video.category?.name ?? "Kategorisiz"}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <ListCardHeader
              title="Kategorilere göre içerik"
              description="Son eklenen kategoriler · makale ve video sayısı"
              href="/admin/kategoriler"
              linkContext="kategoriler"
            />
            {recentCategories.length === 0 ? (
              <EmptyState icon={<FolderTree />} title="Henüz kategori yok" className="py-10" />
            ) : (
              <ul className="divide-y divide-navy-900/[0.06]">
                {recentCategories.map((item) => {
                  const total = item.articles + item.videos;
                  return (
                    <li key={item.categoryId} className="px-5 py-3">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-navy-950">{item.name}</span>
                        <span className="font-semibold text-navy-950 tabular-nums">{total}</span>
                      </div>
                      <div className="mt-2 h-2" aria-hidden="true">
                        <div
                          className="h-full rounded-r-[4px] bg-navy-600"
                          style={{ width: `${(total / maxCategoryTotal) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {item.articles} makale · {item.videos} video
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function StatTile({
  href,
  icon,
  label,
  value,
  detail,
  highlight = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex h-full flex-col rounded-2xl border bg-white p-4 shadow-card transition-colors hover:border-navy-900/25 sm:p-5",
          highlight ? "border-gold-400/70" : "border-navy-900/[0.08]",
        )}
      >
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <p className="text-[13px] leading-snug font-medium text-slate-600 sm:text-sm">{label}</p>
          <span
            className={cn("shrink-0 [&_svg]:size-[18px] sm:[&_svg]:size-5", highlight ? "text-gold-600" : "text-slate-400")}
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>
        <p className="mt-auto pt-3 text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">{value}</p>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">{detail}</p>
      </Link>
    </li>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-navy-900/[0.08] px-4 py-3 text-sm font-medium text-navy-900 transition-colors hover:border-navy-900/20 hover:bg-cream-50 [&_svg]:size-[18px] [&_svg]:text-gold-600"
    >
      {icon}
      {label}
    </Link>
  );
}

function ListCardHeader({
  title,
  description,
  href,
  linkContext,
}: {
  title: string;
  description: string;
  href: string;
  /** Ekran okuyucu için bağlantının hedefi ("Tümünü gör: mesajlar"). */
  linkContext: string;
}) {
  return (
    <CardHeader className="flex-nowrap items-start">
      <div className="min-w-0">
        <CardTitle>{title}</CardTitle>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <Link
        href={href}
        className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-navy-700 hover:text-navy-900"
      >
        Tümünü gör<span className="sr-only">: {linkContext}</span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </CardHeader>
  );
}
