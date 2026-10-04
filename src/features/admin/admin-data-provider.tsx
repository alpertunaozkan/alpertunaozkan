"use client";

import { createContext, use, useReducer, type Dispatch, type ReactNode } from "react";
import type { Article, Category, CategoryRef, ContactMessage, MediaAsset, Video } from "@/types";

/*
 * Panelin istemci tarafı veri deposu.
 *
 * Panel açılırken sunucudaki sorgu katmanından (MongoDB) gelen veriyle
 * başlatılır. Değişiklikler sunucu işlemleriyle (Server Actions) veritabanına
 * yazılır; işlemin döndürdüğü güncel kayıt buraya işlenir, böylece ekranlar
 * sayfa yenilenmeden güncellenir. Ekran bileşenleri depoya doğrudan değil,
 * features/* altındaki hook'lara bağlıdır.
 */

export interface AdminData {
  articles: Article[];
  videos: Video[];
  categories: Category[];
  contacts: ContactMessage[];
  /** Görsel kütüphanesi (Cloudinary); ilk kez kapak seçilirken yüklenir. Yüklenmediyse null. */
  media: MediaAsset[] | null;
}

export type AdminAction =
  | { type: "article/saved"; article: Article }
  | { type: "article/removed"; id: string }
  | { type: "video/saved"; video: Video }
  | { type: "video/removed"; id: string }
  | { type: "category/saved"; category: Category }
  | { type: "category/removed"; id: string }
  | { type: "contact/saved"; contact: ContactMessage }
  | { type: "contact/removed"; id: string }
  | { type: "media/loaded"; media: MediaAsset[] }
  | { type: "media/added"; asset: MediaAsset };

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [item, ...items];
}

function remove<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

/** Kategori yeniden adlandırılınca/silinince içeriklerdeki referansları günceller. */
function replaceCategoryRef<T extends { category: CategoryRef | null }>(
  items: T[],
  categoryId: string,
  next: CategoryRef | null,
): T[] {
  return items.map((item) => (item.category?.id === categoryId ? { ...item, category: next } : item));
}

function reducer(state: AdminData, action: AdminAction): AdminData {
  switch (action.type) {
    case "article/saved":
      return { ...state, articles: upsert(state.articles, action.article) };
    case "article/removed":
      return { ...state, articles: remove(state.articles, action.id) };
    case "video/saved":
      return { ...state, videos: upsert(state.videos, action.video) };
    case "video/removed":
      return { ...state, videos: remove(state.videos, action.id) };
    case "category/saved": {
      const { id, name, slug } = action.category;
      const ref: CategoryRef = { id, name, slug };
      return {
        ...state,
        categories: upsert(state.categories, action.category),
        articles: replaceCategoryRef(state.articles, id, ref),
        videos: replaceCategoryRef(state.videos, id, ref),
      };
    }
    case "category/removed":
      return {
        ...state,
        categories: remove(state.categories, action.id),
        articles: replaceCategoryRef(state.articles, action.id, null),
        videos: replaceCategoryRef(state.videos, action.id, null),
      };
    case "contact/saved":
      return { ...state, contacts: upsert(state.contacts, action.contact) };
    case "contact/removed":
      return { ...state, contacts: remove(state.contacts, action.id) };
    case "media/loaded":
      return { ...state, media: action.media };
    case "media/added":
      return { ...state, media: state.media ? upsert(state.media, action.asset) : [action.asset] };
  }
}

interface AdminDataContextValue {
  data: AdminData;
  dispatch: Dispatch<AdminAction>;
  /** Panel açıldığından beri değişiklik yapılmadıysa true (veri sunucudan geldiği gibi). */
  isPristine: boolean;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({
  initialData,
  children,
}: {
  initialData: AdminData;
  children: ReactNode;
}) {
  const [data, dispatch] = useReducer(reducer, initialData);
  return (
    <AdminDataContext value={{ data, dispatch, isPristine: data === initialData }}>
      {children}
    </AdminDataContext>
  );
}

export function useAdminData(): AdminDataContextValue {
  const context = use(AdminDataContext);
  if (!context) throw new Error("useAdminData, AdminDataProvider içinde kullanılmalıdır.");
  return context;
}
