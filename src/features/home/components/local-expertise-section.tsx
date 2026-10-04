import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/common/container";
import { PracticeAreaIcon } from "@/components/common/practice-area-icon";
import { Eyebrow, Section, SectionHeading } from "@/components/common/section";
import { ButtonLink } from "@/components/ui/button";
import { LOCATION_PAGE } from "@/constants/site";
import { KIRIKKALE_PROMO } from "@/data/kirikkale";
import { practiceAreas } from "@/data/practice-areas";

/** Eski ana sayfadaki "Kırıkkale’de Gayrimenkul Hukukunda Uzman Avukat" bölümü. */
export function LocalExpertiseSection() {
  return (
    <Section aria-labelledby="kirikkale-tanitim">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <SectionHeading
            id="kirikkale-tanitim"
            eyebrow={KIRIKKALE_PROMO.badge}
            title={KIRIKKALE_PROMO.heading}
            description={KIRIKKALE_PROMO.teaser}
          />

          <ul className="mt-8 grid gap-3">
            {practiceAreas.map((area) => (
              <li
                key={area.id}
                className="flex items-start gap-4 rounded-xl border border-navy-900/[0.08] bg-white p-4"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
                  <PracticeAreaIcon name={area.icon} className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-navy-950">{area.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{area.summary}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <ButtonLink href={LOCATION_PAGE.href}>
              Detayları Gör
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
            <Link
              href="/iletisim"
              className="text-sm font-semibold text-navy-800 underline-offset-4 hover:underline"
            >
              İletişim ve randevu
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="h-full rounded-2xl bg-navy-950 p-8 text-white sm:p-10 lg:sticky lg:top-28 lg:h-auto">
            <Eyebrow inverted>Kırıkkale’de neler yapıyoruz?</Eyebrow>
            <ol className="mt-8 space-y-8">
              {KIRIKKALE_PROMO.process.map((step, index) => (
                <li key={step.title} className="flex gap-5">
                  <span className="font-serif text-3xl leading-none text-gold-400 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </Section>
  );
}
