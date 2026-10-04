import type { Metadata } from "next";
import { CategoriesScreen } from "@/features/categories/components/admin/categories-screen";
import { requireAdmin } from "@/server/dal";

export const metadata: Metadata = { title: "Kategoriler" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  return <CategoriesScreen />;
}
