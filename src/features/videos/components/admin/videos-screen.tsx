"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Plus, Search, SearchX, Trash2 } from "lucide-react";
import { AdminPageHeader, EmptyState } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/action-result";
import { formatShortDate } from "@/lib/format";
import { normalizeForSearch } from "@/lib/text";
import { youtubeWatchUrl } from "@/lib/youtube";
import type { Video } from "@/types";
import { useVideosAdmin } from "../../hooks/use-videos-admin";
import { VideoThumbnail } from "../video-thumbnail";
import { VideoFormDialog } from "./video-form-dialog";

type DialogState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; video: Video };

interface VideosScreenProps {
  /** `?yeni=1`: yeni video penceresi açık başlar. */
  openCreate?: boolean;
  /** `?duzenle=<id>`: ilgili videonun düzenleme penceresi açık başlar (ör. Genel Bakış'tan). */
  openEditId?: string;
}

export function VideosScreen({ openCreate = false, openEditId }: VideosScreenProps) {
  const { notify } = useToast();
  const { videos, categories, publishedArticles, saveVideo, removeVideo } = useVideosAdmin();
  const [dialog, setDialog] = useState<DialogState>(() => {
    const editTarget = openEditId ? videos.find((video) => video.id === openEditId) : undefined;
    if (editTarget) return { mode: "edit", video: editTarget };
    return openCreate ? { mode: "create" } : { mode: "closed" };
  });
  const [pendingDelete, setPendingDelete] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");

  const needle = normalizeForSearch(query.trim());
  const visible = [...videos]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter((video) => categoryId === "all" || video.category?.id === categoryId)
    .filter((video) => !needle || normalizeForSearch(`${video.title} ${video.youtubeId}`).includes(needle));

  const editing = dialog.mode === "edit" ? dialog.video : undefined;

  function closeDialog() {
    setDialog({ mode: "closed" });
    // Pencereyi açan adres parametresi (?yeni=1, ?duzenle=…) kaldırılır; sayfa yenilenince pencere tekrar açılmaz.
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeVideo(pendingDelete.id);
      notify({ tone: "success", title: "Video silindi" });
      setPendingDelete(null);
    } catch (error) {
      notify({ tone: "error", title: "Video silinemedi", description: errorMessage(error) });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Videolar"
        description="YouTube kanalındaki videoların sitede gösterimini yönetin."
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus aria-hidden="true" />
            Yeni Video
          </Button>
        }
      />

      <Card className="mb-6 flex flex-col gap-2 p-4 sm:flex-row">
        <label htmlFor="videos-category" className="sr-only">
          Kategori
        </label>
        <Select
          id="videos-category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          wrapperClassName="sm:w-56"
          className="h-10 text-sm"
        >
          <option value="all">Tüm kategoriler</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="videos-search" className="sr-only">
            Video ara
          </label>
          <Input
            id="videos-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Başlık veya YouTube ID"
            className="h-10 pl-9 text-sm"
          />
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchX />}
            title={videos.length === 0 ? "Henüz video yok" : "Filtreye uygun video bulunamadı"}
            description={videos.length === 0 ? "YouTube videolarınızı ekleyerek başlayın." : "Filtreleri değiştirip tekrar deneyin."}
          />
        </Card>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((video) => (
            <li key={video.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-navy-900/[0.08] bg-white shadow-card">
                <VideoThumbnail video={video} sizes="(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 100vw" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {video.category ? <Badge tone="gold">{video.category.name}</Badge> : <Badge tone="outline">Kategorisiz</Badge>}
                    <span>{formatShortDate(video.publishedAt)}</span>
                  </div>
                  <h2 className="mt-3 line-clamp-2 font-semibold text-navy-950">{video.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    YouTube ID: <code className="font-mono text-slate-600">{video.youtubeId}</code>
                  </p>
                  <div className="mt-auto flex items-center gap-1 pt-4">
                    <Button variant="outline" size="sm" onClick={() => setDialog({ mode: "edit", video })}>
                      <Pencil aria-hidden="true" />
                      Düzenle
                    </Button>
                    <ButtonLink
                      href={youtubeWatchUrl(video.youtubeId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${video.title} — YouTube'da aç`}
                      title="YouTube'da aç"
                    >
                      <ExternalLink aria-hidden="true" />
                    </ButtonLink>
                    <Button
                      variant="danger-ghost"
                      size="icon-sm"
                      className="ml-auto"
                      onClick={() => setPendingDelete(video)}
                      aria-label={`${video.title} — sil`}
                      title="Sil"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <VideoFormDialog
        open={dialog.mode !== "closed"}
        video={editing}
        videos={videos}
        categories={categories}
        articles={publishedArticles}
        onClose={closeDialog}
        onSubmit={async (input) => {
          await saveVideo(input, editing);
          notify({ tone: "success", title: editing ? "Video güncellendi" : "Video eklendi" });
          closeDialog();
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Video silinsin mi?"
        description={pendingDelete ? `“${pendingDelete.title}” siteden kaldırılacak. YouTube'daki video etkilenmez.` : undefined}
        pending={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
