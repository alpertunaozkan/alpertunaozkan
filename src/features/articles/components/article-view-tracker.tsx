"use client";

import { useEffect } from "react";

const ENDPOINT = "/api/makale-goruntulenme";

/**
 * Makale tarayıcıda açılınca görüntülenme sayısını bir artırır (panelde
 * "Görüntülenme"). Aynı sekmede yeniden açılan veya yenilenen makale tekrar
 * sayılmaz; botlar ve yönetici sunucuda ayıklanır
 * (bkz. src/app/api/makale-goruntulenme/route.ts).
 */
export function ArticleViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `makale-goruntulendi:${articleId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Tarayıcı depolamaya izin vermiyorsa her açılış sayılır.
    }

    if (!navigator.sendBeacon?.(ENDPOINT, articleId)) {
      fetch(ENDPOINT, { method: "POST", body: articleId, keepalive: true }).catch(() => {});
    }
  }, [articleId]);

  return null;
}
