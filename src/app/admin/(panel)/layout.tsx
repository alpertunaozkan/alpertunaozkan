import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ToastProvider } from "@/components/ui/toast";
import { AdminDataProvider } from "@/features/admin/admin-data-provider";
import { getArticlesForAdmin } from "@/features/articles/queries";
import { getCategories } from "@/features/categories/queries";
import { getContactMessages } from "@/features/contacts/queries";
import { getVideosForAdmin } from "@/features/videos/queries";
import { requireAdmin } from "@/server/dal";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const [articles, videos, categories, contacts] = await Promise.all([
    getArticlesForAdmin(),
    getVideosForAdmin(),
    getCategories(),
    getContactMessages(),
  ]);

  return (
    <ToastProvider>
      <AdminDataProvider initialData={{ articles, videos, categories, contacts, media: null }}>
        <AdminShell>{children}</AdminShell>
      </AdminDataProvider>
    </ToastProvider>
  );
}
