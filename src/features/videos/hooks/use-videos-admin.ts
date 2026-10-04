"use client";

import { useAdminData } from "@/features/admin/admin-data-provider";
import { unwrapAction } from "@/lib/action-result";
import type { Video, VideoInput } from "@/types";
import { deleteVideoAction, saveVideoAction } from "../actions";

/**
 * Panel ekranlarının video verisine ve işlemlerine eriştiği tek nokta.
 * İşlemler sunucuda yapılır; başarısızlıkta ActionError fırlatır.
 */
export function useVideosAdmin() {
  const { data, dispatch } = useAdminData();

  async function saveVideo(input: VideoInput, existing?: Video): Promise<Video> {
    const video = unwrapAction(await saveVideoAction(input, existing?.id));
    dispatch({ type: "video/saved", video });
    return video;
  }

  async function removeVideo(id: string): Promise<void> {
    unwrapAction(await deleteVideoAction(id));
    dispatch({ type: "video/removed", id });
  }

  return {
    videos: data.videos,
    categories: data.categories,
    /** "İlgili makale" seçimi için yalnızca yayındaki makaleler. */
    publishedArticles: data.articles.filter((article) => article.status === "published"),
    saveVideo,
    removeVideo,
  };
}
