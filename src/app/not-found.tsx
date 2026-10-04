import type { Metadata } from "next";
import { ArrowLeft, Mail } from "lucide-react";
import { Container } from "@/components/common/container";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı | Avukat Alper Tuna Özkan",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center bg-cream-100">
        <Container className="py-24 text-center">
          <p className="font-serif text-7xl font-semibold text-gold-500 sm:text-8xl">404</p>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-navy-950 sm:text-4xl">Sayfa Bulunamadı</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-slate-600">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">
              <ArrowLeft aria-hidden="true" />
              Ana sayfaya dön
            </ButtonLink>
            <ButtonLink href="/iletisim" variant="outline">
              <Mail aria-hidden="true" />
              İletişime geç
            </ButtonLink>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
