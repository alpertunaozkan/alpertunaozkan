import type { Article, Category, ContactMessage, DashboardStats, Video } from "@/types";

interface DashboardSource {
  articles: readonly Pick<Article, "status" | "category">[];
  videos: readonly Pick<Video, "category" | "durationSeconds">[];
  categories: readonly Category[];
  contacts: readonly Pick<ContactMessage, "status" | "createdAt">[];
}

/**
 * Panel özet metriklerini içerik listelerinden hesaplar. Hem sunucuda
 * (ilk açılış) hem panelde (bu oturumdaki değişikliklerden sonra) kullanılır.
 */
export function computeDashboardStats({
  articles,
  videos,
  categories,
  contacts,
}: DashboardSource): DashboardStats {
  const published = articles.filter((article) => article.status === "published").length;

  // En son eklenen kategori önce (Genel Bakış son eklenen kategorileri gösterir).
  const contentByCategory = [...categories]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((category) => ({
      categoryId: category.id,
      name: category.name,
      articles: articles.filter((article) => article.category?.id === category.id).length,
      videos: videos.filter((video) => video.category?.id === category.id).length,
    }));

  const lastMessageAt = contacts.reduce<string | null>(
    (latest, message) => (!latest || message.createdAt > latest ? message.createdAt : latest),
    null,
  );

  return {
    articles: { total: articles.length, published, drafts: articles.length - published },
    videos: {
      total: videos.length,
      totalDurationSeconds: videos.reduce((sum, video) => sum + (video.durationSeconds ?? 0), 0),
    },
    categories: { total: categories.length },
    messages: {
      total: contacts.length,
      unread: contacts.filter((message) => message.status === "unread").length,
      archived: contacts.filter((message) => message.status === "archived").length,
    },
    contentByCategory,
    lastMessageAt,
  };
}
