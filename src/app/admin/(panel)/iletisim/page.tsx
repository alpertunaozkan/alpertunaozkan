import type { Metadata } from "next";
import { InboxScreen } from "@/features/contacts/components/admin/inbox-screen";
import { requireAdmin } from "@/server/dal";

export const metadata: Metadata = { title: "İletişim Mesajları" };

export default async function AdminContactPage({ searchParams }: PageProps<"/admin/iletisim">) {
  await requireAdmin();
  const { mesaj } = await searchParams;
  return <InboxScreen initialMessageId={typeof mesaj === "string" ? mesaj : undefined} />;
}
