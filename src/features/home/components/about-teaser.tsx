import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/common/container";
import { Section, SectionHeading } from "@/components/common/section";
import { ButtonLink } from "@/components/ui/button";
import { ABOUT_BIO, ABOUT_FACTS } from "@/data/about";

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

          <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-navy-900/[0.08] bg-navy-900/[0.08] sm:grid-cols-3">
            {ABOUT_FACTS.map((fact) => (
              <div key={fact.label} className="bg-white px-5 py-4">
                <dt className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">{fact.label}</dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-950">{fact.value}</dd>
              </div>
            ))}
          </dl>

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
