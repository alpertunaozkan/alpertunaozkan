"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { CONTACT } from "@/constants/site";
import { cn } from "@/lib/utils";

/**
 * Mobil/tablet için sabit "Hemen Arayın" butonu (masaüstünde header'da telefon
 * bulunduğu için gizlenir). Ana sayfada slider görünürken gizli kalır —
 * eski sitedeki davranış korunmuştur; zıplama animasyonu kaldırılmıştır.
 */
export function FloatingCallButton() {
  const pathname = usePathname();
  const [heroInView, setHeroInView] = useState(true);
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    const hero = document.getElementById("hero-slider");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting && entry.intersectionRatio > 0.1),
      { threshold: [0, 0.1, 0.2] },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [isHome]);

  const visible = !isHome || !heroInView;

  return (
    <a
      href={CONTACT.phone.href}
      aria-label={`Hemen Arayın: ${CONTACT.phone.display}`}
      aria-hidden={!visible}
      data-menu-inert
      tabIndex={visible ? undefined : -1}
      className={cn(
        "fixed right-4 bottom-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-navy-900 px-5 text-sm font-semibold text-white shadow-elevated ring-1 ring-gold-400/40 transition-[opacity,translate] duration-300 hover:bg-navy-800 sm:right-6 sm:bottom-6 xl:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <Phone className="size-[18px] text-gold-300" aria-hidden="true" />
      Hemen Arayın
    </a>
  );
}
