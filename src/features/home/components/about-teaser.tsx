import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/common/container";
import { Section, SectionHeading } from "@/components/common/section";
import { ButtonLink } from "@/components/ui/button";
import { ABOUT_BIO } from "@/data/about";

export function AboutTeaser() {
  return (
    <Section tone="cream" aria-labelledby="hakkimda-ozet">
      <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -bottom-4 -left-4 hidden h-full w-full rounded-2xl border border-gold-400/70 sm:block"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-navy-100 shadow-elevated">
            <Image
              src="/images/profile/alper-tuna-ozkan-ofis.webp"
              alt="Av. Alper Tuna Özkan Kırıkkale’deki ofisinde"
              fill
              sizes="(min-width: 1024px) 38vw, (min-width: 640px) 28rem, 100vw"
              quality={75}
              className="object-cover object-[42%_center]"
            />
          </div>
        </div>

        <div className="lg:col-span-7">
          <SectionHeading id="hakkimda-ozet" eyebrow="Hakkımda" title="Av. Alper Tuna Özkan" />
          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">{ABOUT_BIO[0]}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/hakkimda">
              Hakkımda Daha Fazlası
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/iletisim" variant="outline">
              İletişime Geçin
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
