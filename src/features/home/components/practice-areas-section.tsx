import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/common/container";
import { PracticeAreaIcon } from "@/components/common/practice-area-icon";
import { Section, SectionHeading } from "@/components/common/section";
import { ButtonLink } from "@/components/ui/button";
import { PRACTICE_AREAS_INTRO, practiceAreas } from "@/data/practice-areas";
import { cn } from "@/lib/utils";

export function PracticeAreasSection() {
  return (
    <Section aria-labelledby="faaliyet-alanlari">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="faaliyet-alanlari"
            eyebrow="Uzmanlık Alanları"
            title="Faaliyet Alanlarım"
            description={PRACTICE_AREAS_INTRO}
          />
          <ButtonLink href="/faaliyet-alanlarim" variant="outline" className="self-start lg:self-auto">
            Tüm Faaliyet Alanlarını Görüntüle
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {practiceAreas.map((area, index) => (
            <li
              key={area.id}
              className={cn(
                index < 3 ? "lg:col-span-2" : "lg:col-span-3",
                index === practiceAreas.length - 1 && "sm:col-span-2 lg:col-span-3",
              )}
            >
              <Link
                href={`/faaliyet-alanlarim#${area.id}`}
                className="group flex h-full flex-col rounded-2xl border border-navy-900/[0.08] bg-white p-6 shadow-card transition-[box-shadow,border-color] duration-300 hover:border-gold-400/60 hover:shadow-elevated sm:p-7"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-navy-950 text-gold-300">
                  <PracticeAreaIcon name={area.icon} className="size-6" />
                </span>
                <h3 className="mt-6 font-serif text-xl font-semibold text-navy-950">{area.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{area.description}</p>
                <ul className="mt-5 space-y-2 border-t border-navy-900/[0.07] pt-5 text-sm text-slate-700">
                  {area.highlights.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-navy-800">
                  Detaylı bilgi
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
