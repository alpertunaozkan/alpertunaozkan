"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Mail, Menu, Phone, X } from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { SocialIcon } from "@/components/common/social-icon";
import { CONTACT, MAIN_NAV, SOCIAL_LINKS } from "@/constants/site";
import { cn } from "@/lib/utils";

/** Mobil menüde sırayla beliren öğelerin gecikme sırası (globals.css → .mobile-menu). */
const itemOrder = (index: number) => ({ "--item-index": index }) as CSSProperties;

/**
 * Header yüksekliği tüm kırılımlarda 72px'tir. Ana sayfa slider'ı
 * `h-[calc(100dvh-72px)]` ile bu değere göre tasarlandığı için değiştirilmemeli.
 */
export function SiteHeader() {
  const pathname = usePathname();
  // Menü açıldığı sayfaya bağlıdır; sayfa değişince (geri tuşu dahil) kendiliğinden kapanır.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const menuOpen = openedOn === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const closeMenu = () => setOpenedOn(null);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenedOn(null);
      toggleRef.current?.focus();
    };
    const desktopQuery = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setOpenedOn(null);
    };
    // Menü açıkken arkadaki içerik klavye ve ekran okuyucu için devre dışı kalır.
    // (Sayfa kaydırma kilidi globals.css'te <html> üzerindedir.)
    const background = document.querySelectorAll<HTMLElement>("[data-menu-inert]");

    background.forEach((element) => {
      element.inert = true;
    });
    document.addEventListener("keydown", closeOnEscape);
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => {
      background.forEach((element) => {
        element.inert = false;
      });
      document.removeEventListener("keydown", closeOnEscape);
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-white/10 bg-navy-950 text-white">
      <div className="flex h-full items-center justify-between gap-6 px-4 sm:px-6 lg:px-16">
        <BrandLogo onClick={closeMenu} />

        <nav aria-label="Ana menü" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="relative block rounded-md px-3.5 py-2 text-[14.5px] font-medium text-white/75 transition-colors after:absolute after:inset-x-3.5 after:bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-gold-400/60 after:transition-transform after:duration-300 after:ease-out hover:text-white hover:after:scale-x-100 aria-[current=page]:text-white aria-[current=page]:after:scale-x-100 aria-[current=page]:after:bg-gold-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={CONTACT.phone.href}
            className="hidden items-center gap-2 rounded-full border border-gold-400/40 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:border-gold-400 hover:bg-white/5 md:inline-flex"
          >
            <Phone className="size-4 text-gold-300" aria-hidden="true" />
            {CONTACT.phone.display}
          </a>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpenedOn(menuOpen ? null : pathname)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 xl:hidden"
          >
            <span className="relative size-6" aria-hidden="true">
              <Menu
                className={cn(
                  "absolute inset-0 size-6 transition-[opacity,rotate,scale] duration-200 ease-out motion-reduce:transition-none",
                  menuOpen && "scale-75 rotate-90 opacity-0",
                )}
              />
              <X
                className={cn(
                  "absolute inset-0 size-6 transition-[opacity,rotate,scale] duration-200 ease-out motion-reduce:transition-none",
                  !menuOpen && "scale-75 -rotate-90 opacity-0",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        data-state={menuOpen ? "open" : "closed"}
        inert={!menuOpen}
        className="mobile-menu fixed inset-x-0 top-[72px] bottom-0 overflow-y-auto overscroll-contain border-t border-white/10 bg-navy-950 xl:hidden"
      >
        <nav aria-label="Mobil menü" className="px-4 py-6 sm:px-6">
          <ul className="divide-y divide-white/10">
            {MAIN_NAV.map((item, index) => (
              <li key={item.href} data-menu-item style={itemOrder(index)}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between py-4 font-serif text-2xl text-white/85 transition-colors hover:text-white",
                    "aria-[current=page]:text-gold-300",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid gap-3" data-menu-item style={itemOrder(MAIN_NAV.length)}>
            <a
              href={CONTACT.phone.href}
              className="flex items-center gap-3 rounded-xl bg-gold-400 px-5 py-4 font-semibold text-navy-950 transition-colors hover:bg-gold-300"
            >
              <Phone className="size-5" aria-hidden="true" />
              {CONTACT.phone.display}
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-3 rounded-xl border border-white/15 px-5 py-4 text-white/85 transition-colors hover:border-white/30 hover:text-white"
            >
              <Mail className="size-5 text-gold-300" aria-hidden="true" />
              <span className="truncate">{CONTACT.email}</span>
            </a>
          </div>

          <ul className="mt-8 flex gap-3" aria-label="Sosyal medya" data-menu-item style={itemOrder(MAIN_NAV.length + 1)}>
            {SOCIAL_LINKS.map((social) => (
              <li key={social.platform}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-gold-400 hover:text-gold-300"
                >
                  <SocialIcon platform={social.platform} className="size-[18px]" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
