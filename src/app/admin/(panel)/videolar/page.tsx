import type { Metadata } from "next";
import { VideosScreen } from "@/features/videos/components/admin/videos-screen";
import { requireAdmin } from "@/server/dal";

export const metadata: Metadata = { title: "Videolar" };

export default async function AdminVideosPage({ searchParams }: PageProps<"/admin/videolar">) {
  await requireAdmin();
  const { yeni, duzenle } = await searchParams;
  return <VideosScreen openCreate={yeni === "1"} openEditId={typeof duzenle === "string" ? duzenle : undefined} />;
}
