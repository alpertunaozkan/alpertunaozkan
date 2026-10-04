import Image from "next/image";
import { ArrowRight, BookOpen, MapPin, ShieldCheck, Target } from "lucide-react";
import { Container } from "@/components/common/container";
import { JsonLd } from "@/components/common/json-ld";
import { Section, SectionHeading } from "@/components/common/section";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/components/public/breadcrumbs";
import { ContactCta } from "@/components/public/contact-cta";
import { PageHero } from "@/components/public/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { CONTACT, LOCATION_PAGE } from "@/constants/site";
import { ABOUT_BIO, ABOUT_FACTS, ABOUT_PRINCIPLES, OFFICE_PHOTOS } from "@/data/about";
import { buildPageMetadata } from "@/lib/seo";
import { personJsonLd } from "@/lib/structured-data";

const PATH = "/hakkimda";

export const metadata = buildPageMetadata({
  title: "Kırıkkale Gayrimenkul Avukatı Alper Tuna Özkan | Hakkımda",
  description:
    "Kırıkkale doğumlu Av. Alper Tuna Özkan; Kırıkkale'de gayrimenkul, inşaat ve kira uyuşmazlıklarında danışmanlık sağlar.",
  socialDescription: "Gayrimenkul hukuku ağırlıklı çalışma alanı ve mesleki bilgiler.",
  path: PATH,
  type: "profile",
});

const breadcrumbs: BreadcrumbItem[] = [{ label: "Ana Sayfa", href: "/" }, { label: "Hakkımda" }];

const principleIcons = [ShieldCheck, BookOpen, Target];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Av. Alper Tuna Özkan"
        title="Hakkımda"
        description="Gayrimenkul hukukunda uzmanlık ve güven."
        breadcrumbs={breadcrumbs}
      />

      <Section aria-labelledby="biyografi">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div
                  aria-hidden="true"
                  className="absolute -right-4 -bottom-4 hidden h-full w-full rounded-2xl border border-gold-400/70 sm:block"
                />
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-navy-100 shadow-elevated">
                  <Image
                    src="/images/profile/alper-tuna-ozkan-portre.webp"
                    alt="Avukat Alper Tuna Özkan"
                    fill
                    preload
                    sizes="(min-width: 1024px) 36vw, (min-width: 640px) 28rem, 92vw"
                    quality={78}
                    className="object-cover object-top"
                  />
                </div>
              </div>

              <dl className="mt-10 divide-y divide-navy-900/[0.08] rounded-2xl border border-navy-900/[0.08] bg-cream-50">
                {ABOUT_FACTS.map((fact) => (
                  <div key={fact.label} className="flex items-baseline justify-between gap-6 px-5 py-4">
                    <dt className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
                      {fact.label}
                    </dt>
                    <dd className="text-right text-sm font-medium text-navy-950">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="lg:col-span-7">
            <SectionHeading id="biyografi" eyebrow="Biyografi" title="Avukat Alper Tuna Özkan" />
            <div className="mt-8 space-y-6 text-[17px] leading-[1.85] text-slate-700">
              {ABOUT_BIO.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/faaliyet-alanlarim">
                Faaliyet Alanlarım
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/iletisim" variant="outline">
                İletişime Geçin
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="cream" aria-labelledby="calisma-yaklasimi">
        <Container>
          <SectionHeading id="calisma-yaklasimi" eyebrow="Çalışma Yaklaşımı" title="Her vakaya aynı özen" align="center" />
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {ABOUT_PRINCIPLES.map((principle, index) => {
              const Icon = principleIcons[index % principleIcons.length];
              return (
                <li key={principle.title} className="rounded-2xl border border-navy-900/[0.08] bg-white p-7 shadow-card">
                  <span className="inline-flex size-12 items-center justify-center rounded-xl bg-navy-950 text-gold-300">
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 font-serif text-xl font-semibold text-navy-950">{principle.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{principle.description}</p>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section aria-labelledby="ofisimiz">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              id="ofisimiz"
              eyebrow="Kırıkkale Ofisi"
              title="Ofisimiz"
              description={
                <span className="inline-flex items-start gap-2">
                  <MapPin className="mt-1 size-4 shrink-0 text-gold-600" aria-hidden="true" />
                  {CONTACT.address.lines.join(", ")}
                </span>
              }
            />
            <ButtonLink href={LOCATION_PAGE.href} variant="outline" className="self-start lg:self-auto">
              {LOCATION_PAGE.label}
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {OFFICE_PHOTOS.map((photo, index) => (
              <li key={photo.src} className={index === 0 ? "sm:col-span-2 lg:col-span-1" : undefined}>
                <figure>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-navy-100">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                      quality={72}
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-3 text-sm font-medium text-slate-600">{photo.caption}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ContactCta />
      <JsonLd data={[personJsonLd(), breadcrumbJsonLd(breadcrumbs, PATH)]} />
    </>
  );
}
