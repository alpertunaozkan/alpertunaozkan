import type { ReactNode } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/common/container";
import { JsonLd } from "@/components/common/json-ld";
import { Section } from "@/components/common/section";
import { SocialIcon } from "@/components/common/social-icon";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/components/public/breadcrumbs";
import { PageHero } from "@/components/public/page-hero";
import { CONTACT, SOCIAL_LINKS } from "@/constants/site";
import { ContactForm } from "@/features/contacts/components/contact-form";
import { OfficeLocation } from "@/features/contacts/components/office-location";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { ORGANIZATION_ID } from "@/lib/structured-data";

const PATH = "/iletisim";

export const metadata = buildPageMetadata({
  title: "Kırıkkale Gayrimenkul Avukatı Alper Tuna Özkan | İletişim",
  description:
    "Randevu ve danışmanlık talepleriniz için iletişim bilgileri. Ofis başvuru kanalları ve çalışma saatleri.",
  socialDescription: "İletişim kanalları ve çalışma saatleri.",
  path: PATH,
});

const breadcrumbs: BreadcrumbItem[] = [{ label: "Ana Sayfa", href: "/" }, { label: "İletişim" }];

const contactPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: absoluteUrl(PATH),
  name: "İletişim",
  about: { "@id": ORGANIZATION_ID },
  mainEntity: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: CONTACT.phone.e164,
    email: CONTACT.email,
    availableLanguage: ["tr"],
    areaServed: "TR",
  },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="İletişim"
        title="İletişim"
        description="Hukuki sorularınız için hemen iletişime geçin."
        breadcrumbs={breadcrumbs}
      />

      <Section className="pt-10 sm:pt-12 lg:pt-16">
        <Container className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="grid content-start gap-4 lg:col-span-5">
            <InfoCard icon={<MapPin />} title="Kırıkkale Adres">
              <a
                href={CONTACT.maps.place}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-navy-900 underline-offset-4 hover:underline"
              >
                {CONTACT.address.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </a>
            </InfoCard>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <InfoCard icon={<Phone />} title="Telefon">
                <a href={CONTACT.phone.href} className="font-semibold text-navy-900 hover:underline">
                  {CONTACT.phone.display}
                </a>
              </InfoCard>
              <InfoCard icon={<Mail />} title="E-posta">
                <a href={`mailto:${CONTACT.email}`} className="font-semibold break-all text-navy-900 hover:underline">
                  {CONTACT.email}
                </a>
              </InfoCard>
            </div>
            <InfoCard icon={<Clock />} title="Çalışma Saatleri">
              <p className="font-semibold text-navy-900">{CONTACT.workingHours.weekdays}</p>
              <p className="text-sm text-slate-500">{CONTACT.workingHours.weekend}</p>
            </InfoCard>
            <div className="rounded-2xl bg-navy-950 p-6 text-white">
              <p className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">Sosyal Medya</p>
              <ul className="mt-4 flex flex-wrap gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.platform}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 transition-colors hover:border-gold-400 hover:text-white"
                    >
                      <SocialIcon platform={social.platform} className="size-4" />
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div id="iletisim-formu" className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-navy-900/[0.08] bg-white shadow-card">
              <div className="border-b border-navy-900/[0.07] bg-cream-50 px-6 py-5 sm:px-8">
                <h2 className="font-serif text-2xl font-semibold text-navy-950">İletişim Formu</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Hukuki sorularınız için formu doldurun, kısa sürede dönüş yapalım.
                </p>
              </div>
              <div className="p-6 sm:p-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="cream" className="py-14 sm:py-16 lg:py-20">
        <Container>
          <OfficeLocation
            image={{ src: "/images/office/kitaplik.webp", alt: "Kırıkkale ofisindeki hukuk kütüphanesi" }}
          />
        </Container>
      </Section>

      <JsonLd data={[contactPageJsonLd, breadcrumbJsonLd(breadcrumbs, PATH)]} />
    </>
  );
}

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-navy-900/[0.08] bg-white p-5 shadow-card">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-700 [&_svg]:size-5">
        {icon}
      </span>
      <div className="min-w-0 text-[15px] leading-relaxed">
        <h2 className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">{title}</h2>
        <div className="mt-1.5">{children}</div>
      </div>
    </div>
  );
}
