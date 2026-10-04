"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Clapperboard,
  FolderTree,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import { PageTransition } from "@/components/common/page-transition";
import { ButtonLink } from "@/components/ui/button";
import { useDialogPresence } from "@/components/ui/use-dialog-presence";
import { useAdminData } from "@/features/admin/admin-data-provider";
import { logout } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "unread" | "drafts";
}

const NAV_SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  { label: "Genel", items: [{ href: "/admin/dashboard", label: "Genel Bakış", icon: LayoutDashboard }] },
  {
    label: "İçerik",
    items: [
      { href: "/admin/makaleler", label: "Makaleler", icon: Newspaper, badge: "drafts" },
      { href: "/admin/videolar", label: "Videolar", icon: Clapperboard },
      { href: "/admin/kategoriler", label: "Kategoriler", icon: FolderTree },
    ],
  },
  {
    label: "İletişim",
    items: [{ href: "/admin/iletisim", label: "Mesajlar", icon: Inbox, badge: "unread" }],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Mobil menü açıldığı sayfaya bağlıdır; sayfa değişince kendiliğinden kapanır.
  const [navOpenOn, setNavOpenOn] = useState<string | null>(null);
  const navOpen = navOpenOn === pathname;
  const drawerRef = useRef<HTMLDialogElement>(null);
  const drawerPresent = useDialogPresence(drawerRef, navOpen);
  const closeNav = () => setNavOpenOn(null);

  // Mobil menü açıkken pencere masaüstü genişliğine büyürse menü kapanır
  // (aksi hâlde gizli ama açık kalan dialog sayfa kaydırmasını kilitler).
  useEffect(() => {
    if (!navOpen) return;
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setNavOpenOn(null);
    };
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, [navOpen]);

  return (
    <div className="min-h-dvh bg-[#f6f5f1] text-navy-950">
      <a
        href="#panel-icerik"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        İçeriğe geç
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <AdminSidebar />
      </aside>

      <dialog
        ref={drawerRef}
        aria-label="Panel menüsü"
        onClose={(event) => {
          if (event.target === event.currentTarget) closeNav();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeNav();
        }}
        className="drawer-slide m-0 h-dvh max-h-dvh w-72 max-w-[85vw] bg-transparent p-0 lg:hidden"
      >
        {drawerPresent ? <AdminSidebar onNavigate={closeNav} /> : null}
      </dialog>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-navy-900/[0.08] bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setNavOpenOn(pathname)}
              aria-label="Menüyü aç"
              className="-ml-1 inline-flex size-10 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-900/5 lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-4">
              <ButtonLink href="/" target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Siteyi görüntüle
                <ArrowUpRight aria-hidden="true" />
              </ButtonLink>
              <span className="hidden h-8 w-px bg-navy-900/10 sm:block" aria-hidden="true" />
              <AdminProfile />
            </div>
          </div>
        </header>

        <main id="panel-icerik" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}

/** Oturumdaki kullanıcı (başlığın sağında). */
function AdminProfile() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-gold-400/50">
        <Image
          src="/images/profile/alper-tuna-ozkan-portre.webp"
          alt=""
          fill
          sizes="36px"
          className="object-cover object-top"
        />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-navy-950">Av. Alper Tuna Özkan</p>
        <p className="text-xs text-slate-500">Yönetici</p>
      </div>
    </div>
  );
}

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data } = useAdminData();

  const badges = {
    unread: data.contacts.filter((message) => message.status === "unread").length,
    drafts: data.articles.filter((article) => article.status === "draft").length,
  };

  return (
    <div className="flex h-full flex-col bg-navy-950 text-white">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <span className="relative h-8 w-5 shrink-0">
          <Image src="/images/brand/logo.svg" alt="" fill sizes="20px" unoptimized className="object-contain" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-serif text-[15px] font-semibold">Av. Alper Tuna Özkan</p>
          <p className="text-[10px] font-medium tracking-[0.24em] text-gold-300 uppercase">Yönetim Paneli</p>
        </div>
      </div>

      <nav aria-label="Panel menüsü" className="flex-1 overflow-y-auto px-3 py-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-6 last:mb-0">
            <p className="px-3 text-[11px] font-semibold tracking-[0.16em] text-white/60 uppercase">{section.label}</p>
            <ul className="mt-2 grid gap-1">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const count = item.badge ? badges[item.badge] : 0;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon className={cn("size-[18px]", active ? "text-gold-300" : "text-white/50")} aria-hidden="true" />
                      {item.label}
                      {count > 0 ? (
                        <span
                          className={cn(
                            "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                            item.badge === "unread" ? "bg-gold-400 text-navy-950" : "bg-white/10 text-white/80",
                          )}
                        >
                          {count}
                          <span className="sr-only">{item.badge === "unread" ? " okunmamış mesaj" : " taslak"}</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        {/* Başlıktaki "Siteyi görüntüle" telefonda gizlenir; orada menüden açılır. */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white sm:hidden"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
          Siteyi görüntüle
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Çıkış Yap
          </button>
        </form>
      </div>
    </div>
  );
}
