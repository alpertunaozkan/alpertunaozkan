"use client";

import { usePathname } from "next/navigation";
import { ViewTransition, type ReactNode } from "react";

/**
 * Sayfa geçişi: rota değiştiğinde eski içerik hızla solar, yenisi hafifçe
 * yukarı kayarak belirir. Next.js gezinmeleri birer React Transition olduğu
 * için <ViewTransition> tarayıcının View Transitions API'siyle çalışır;
 * desteklemeyen tarayıcılarda sayfa animasyonsuz değişir. Animasyonlar
 * globals.css'teki `.page` sınıfıyla tanımlıdır ve "hareketi azalt"
 * tercihinde kapanır. Aynı sayfadaki güncellemeler (filtre vb.) animasyon
 * tetiklemez (`default="none"`).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition key={pathname} enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}
