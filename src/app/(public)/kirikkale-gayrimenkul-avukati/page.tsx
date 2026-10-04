import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { Container } from "@/components/common/container";
import { JsonLd } from "@/components/common/json-ld";
import { Section, SectionHeading } from "@/components/common/section";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/components/public/breadcrumbs";
import { ContactCta } from "@/components/public/contact-cta";
import { PageHero } from "@/components/public/page-hero";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { CONTACT, LOCATION_PAGE } from "@/constants/site";
import {
  KIRIKKALE_FAQS,
  KIRIKKALE_PAGE,
  KIRIKKALE_PROCESS,
  KIRIKKALE_SERVICES,
} from "@/data/kirikkale";
import { OfficeLocation } from "@/features/contacts/components/office-location";
import { FaqList } from "@/features/location/components/faq-list";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { ORGANIZATION_ID } from "@/lib/structured-data";

const PATH = LOCATION_PAGE.href;

export const metadata = buildPageMetadata({
  title: "Kırıkkale Gayrimenkul Avukatı | Avukat Alper Tuna Özkan",
  description:
    "Kırıkkale’de kamulaştırma, miras paylaşımı, kira ve kat karşılığı inşaat sözleşmeleri süreçlerinde hukuki yol haritası.",
  socialDescription:
    "Kırıkkale’de kamulaştırma, kira ve kat karşılığı inşaat uyuşmazlıklarının nasıl yönetildiğini öğrenin.",
  path: PATH,
});

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Kırıkkale Gayrimenkul Avukatı" },
];

/* Eski sayfadaki çapa id'leri korunmuştur. */
const SECTIONS = [
  { id: "hizmetlerimiz", label: "Hizmetlerimiz" },
  { id: "surec-yol-haritasi", label: "Süreç & Yol Haritası" },
  { id: "sik-sorulan-sorular", label: "Sık Sorulan Sorular" },
  { id: "ofis-iletisimi", label: "Ofis İletişimi" },
] as const;

export default function KirikkalePage() {
  const legalServiceJsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": `${absoluteUrl(PATH)}#legalservice`,
    name: "Avukat Alper Tuna Özkan — Kırıkkale",
    url: absoluteUrl(PATH),
    image: absoluteUrl(KIRIKKALE_PAGE.heroImage.src),
    parentOrganization: { "@id": ORGANIZATION_ID },
    areaServed: { "@type": "City", name: KIRIKKALE_PAGE.city },
    telephone: CONTACT.phone.e164,
    hasMap: CONTACT.maps.place,
    makesOffer: KIRIKKALE_SERVICES.map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service.title, description: service.description },
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: KIRIKKALE_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <PageHero
        eyebrow="Kırıkkale ve çevresi"
        title={KIRIKKALE_PAGE.title}
        description={KIRIKKALE_PAGE.headerDescription}
        breadcrumbs={breadcrumbs}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={CONTACT.phone.href}>
            <Phone aria-hidden="true" />
            Hemen Ara
          </ButtonLink>
          <ButtonLink href="/iletisim#iletisim-formu" variant="outline">
            <Mail aria-hidden="true" />
            İletişim Formu
          </ButtonLink>
        </div>
      </PageHero>

      <Section className="pb-12 sm:pb-14 lg:pb-16">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Badge tone="navy" className="px-3 py-1 text-[13px]">
              {KIRIKKALE_PAGE.subtitle}
            </Badge>
            <p className="mt-6 text-[17px] leading-[1.85] text-slate-700">{KIRIKKALE_PAGE.intro}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-100 shadow-elevated">
            <Image
              src={KIRIKKALE_PAGE.heroImage.src}
              alt={KIRIKKALE_PAGE.heroImage.alt}
              fill
              preload
              sizes="(min-width: 1024px) 45vw, 100vw"
              quality={75}
              className="object-cover"
            />
          </div>
        </Container>
        <Container className="mt-12">
          <nav aria-label="Sayfa içeriği" className="rounded-2xl border border-navy-900/[0.08] bg-cream-50 p-5 sm:p-6">
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">İçindekiler</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="inline-flex rounded-full border border-navy-900/12 bg-white px-4 py-2 text-sm font-medium text-navy-900 transition-colors hover:border-gold-400"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </Section>

      <Section id="hizmetlerimiz" tone="cream" aria-labelledby="hizmetlerimiz-baslik">
        <Container>
          <SectionHeading id="hizmetlerimiz-baslik" eyebrow="Kırıkkale" title="Hizmetlerimiz" />
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {KIRIKKALE_SERVICES.map((service, index) => (
              <li key={service.title} className="rounded-2xl border border-navy-900/[0.08] bg-white p-6 shadow-card sm:p-7">
                <span className="font-serif text-sm font-semibold text-gold-700 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-serif text-xl font-semibold text-navy-950">{service.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{service.description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="surec-yol-haritasi" aria-labelledby="surec-baslik">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              id="surec-baslik"
              eyebrow="Nasıl çalışıyoruz?"
              title="Süreç ve Yol Haritası"
              className="lg:sticky lg:top-28"
            />
          </div>
          <ol className="relative ml-[1.125rem] space-y-10 border-l border-gold-400/50 pl-8 lg:col-span-8 lg:ml-0">
            {KIRIKKALE_PROCESS.map((step, index) => (
              <li key={step.title} className="relative">
                <span className="absolute top-0 -left-[3.05rem] inline-flex size-9 items-center justify-center rounded-full bg-navy-950 font-serif text-sm font-semibold text-gold-300 ring-4 ring-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-navy-950">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section id="sik-sorulan-sorular" tone="cream" aria-labelledby="sss-baslik">
        <Container size="narrow">
          <SectionHeading
            id="sss-baslik"
            eyebrow="SSS"
            title={`${KIRIKKALE_PAGE.city} İçin Sık Sorulan Sorular`}
            align="center"
          />
          <div className="mt-10">
            <FaqList items={KIRIKKALE_FAQS} />
          </div>
        </Container>
      </Section>

      <Section id="ofis-iletisimi">
        <Container>
          <OfficeLocation image={KIRIKKALE_PAGE.officeImage} title={`${KIRIKKALE_PAGE.city} Ofis İletişimi`} />
        </Container>
      </Section>

      <ContactCta />
      <JsonLd data={[legalServiceJsonLd, faqJsonLd, breadcrumbJsonLd(breadcrumbs, PATH)]} />
    </>
  );
}
