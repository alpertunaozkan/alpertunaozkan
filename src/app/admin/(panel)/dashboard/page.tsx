import type { Metadata } from "next";
import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";
import { getDashboardStats } from "@/features/dashboard/queries";

export const metadata: Metadata = { title: "Genel Bakış" };

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return <DashboardScreen serverStats={stats} />;
}
