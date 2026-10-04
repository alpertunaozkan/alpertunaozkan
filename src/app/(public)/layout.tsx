import type { ReactNode } from "react";
import { JsonLd } from "@/components/common/json-ld";
import { PageTransition } from "@/components/common/page-transition";
import { FloatingCallButton } from "@/components/public/floating-call-button";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { organizationJsonLd } from "@/lib/structured-data";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#icerik"
        data-menu-inert
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-950"
      >
        İçeriğe geç
      </a>
      <SiteHeader />
      <main id="icerik" className="flex-1" data-menu-inert>
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
      <FloatingCallButton />
      <JsonLd data={organizationJsonLd()} />
    </div>
  );
}
