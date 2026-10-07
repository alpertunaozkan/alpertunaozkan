import type { Metadata } from "next";
import { getArticleViewCounts } from "@/features/articles/queries";
import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";
import { getDashboardStats } from "@/features/dashboard/queries";

export const metadata: Metadata = { title: "Genel Bakış" };

export default async function DashboardPage() {
  const [stats, viewCounts] = await Promise.all([getDashboardStats(), getArticleViewCounts()]);
  return <DashboardScreen serverStats={stats} viewCounts={viewCounts} />;
}
