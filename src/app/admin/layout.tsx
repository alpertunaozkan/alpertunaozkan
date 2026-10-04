import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Yönetim Paneli", template: "%s | Yönetim Paneli" },
  robots: { index: false, follow: false, nocache: true },
};

/*
 * Panel yalnızca /admin altından erişilir. /admin/login dışındaki rotalar
 * oturum ister: src/proxy.ts çerezi, src/server/dal.ts (requireAdmin)
 * oturumun veritabanındaki geçerliliğini kontrol eder.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
