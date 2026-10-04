import Link from "next/link";
import { ArrowRight, Check, FileText, MessageSquare } from "lucide-react";
import { Container } from "@/components/common/container";
import { JsonLd } from "@/components/common/json-ld";
import { PracticeAreaIcon } from "@/components/common/practice-area-icon";
import { Section } from "@/components/common/section";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/components/public/breadcrumbs";
import { ContactCta } from "@/components/public/contact-cta";
import { PageHero } from "@/components/public/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { CONTACT, LOCATION_PAGE } from "@/constants/site";
import { PRACTICE_AREAS_INTRO, practiceAreas } from "@/data/practice-areas";
import { getPublishedArticles } from "@/features/articles/queries";
import { buildPageMetadata } from "@/lib/seo";

const PATH = "/faaliyet-alanlarim";

export const metadata = buildPageMetadata({
  title: "Faaliyet Alanlarım | Avukat Alper Tuna Özkan",
  description:
    "Tapu, kira, inşaat, miras ve kamulaştırma uyuşmazlıklarında bilgi amaçlı içerikler ve hizmet kapsamı.",
  socialDescription: "Gayrimenkul hukuku ve ilişkili alanlarda sunduğumuz hizmet kapsamı.",
  path: PATH,
});

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Faaliyet Alanlarım" },
];

export default async function PracticeAreasPage() {
  const articles = await getPublishedArticles();

  return (
    <>
      <PageHero
        eyebrow="Hizmetler"
        title="Faaliyet Alanlarım"
        description={PRACTICE_AREAS_INTRO}
        breadcrumbs={breadcrumbs}
      />

      <Section className="pt-10 sm:pt-12 lg:pt-16">
        <Container className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <aside className="min-w-0 lg:col-span-4 xl:col-span-3">
            <nav aria-label="Faaliyet alanları" className="lg:sticky lg:top-28">
              <p className="hidden text-xs font-semibold tracking-[0.18em] text-gold-700 uppercase lg:block">
                Alanlar
              </p>
              <ul className="-mx-4 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-2 [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-4 lg:grid lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0 lg:[mask-image:none]">
                {practiceAreas.map((area) => (
                  <li key={area.id} className="shrink-0">
                    <a
                      href={`#${area.id}`}
                      className="flex items-center gap-3 rounded-full border border-navy-900/10 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-navy-900 transition-colors hover:border-gold-400 lg:rounded-lg lg:border-transparent lg:bg-transparent lg:px-3 lg:py-2.5 lg:hover:bg-cream-100"
                    >
                      <PracticeAreaIcon name={area.icon} className="size-4 text-gold-600" />
                      {area.title}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-8 hidden rounded-2xl bg-navy-950 p-6 text-white lg:block">
                <p className="font-serif text-lg font-semibold">Hukuki desteğe mi ihtiyacınız var?</p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Randevu ve bilgi talebi için bizi arayın veya form üzerinden mesaj bırakın.
                </p>
                <ButtonLink href={CONTACT.phone.href} variant="gold" size="sm" className="mt-5 w-full">
                  {CONTACT.phone.display}
                </ButtonLink>
              </div>
            </nav>
          </aside>

          <div className="min-w-0 space-y-6 lg:col-span-8 xl:col-span-9">
            {practiceAreas.map((area) => {
              const related = articles
                .filter((article) => article.category && area.relatedCategorySlugs.includes(article.category.slug))
                .slice(0, 3);

              return (
                <article
                  key={area.id}
                  id={area.id}
                  aria-labelledby={`${area.id}-baslik`}
                  className="rounded-2xl border border-navy-900/[0.08] bg-white p-6 shadow-card sm:p-8 lg:p-10"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-navy-950 text-gold-300">
                      <PracticeAreaIcon name={area.icon} className="size-7" />
                    </span>
                    <div>
                      <h2 id={`${area.id}-baslik`} className="font-serif text-2xl font-semibold text-navy-950 sm:text-[1.75rem]">
                        {area.title}
                      </h2>
                      <p className="mt-2 text-base leading-relaxed text-slate-600">{area.description}</p>
                    </div>
                  </div>

                  <ul className="mt-8 grid gap-x-8 gap-y-3 border-t border-navy-900/[0.07] pt-8 text-[15px] text-slate-700 sm:grid-cols-2">
                    {area.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <Check className="mt-0.5 size-[18px] shrink-0 text-gold-600" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {related.length > 0 ? (
                    <div className="mt-8 rounded-xl bg-cream-100 p-5">
                      <p className="flex items-center gap-2 text-sm font-semibold text-navy-950">
                        <FileText className="size-4 text-gold-700" aria-hidden="true" />
                        Bu alandaki makaleler
                      </p>
                      <ul className="mt-3 grid gap-2">
                        {related.map((article) => (
                          <li key={article.id}>
                            <Link
                              href={`/makalelerim/${article.slug}`}
                              className="group inline-flex items-start gap-2 text-sm text-navy-800 hover:text-navy-600"
                            >
                              <ArrowRight className="mt-0.5 size-4 shrink-0 text-gold-600 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                              <span className="underline-offset-4 group-hover:underline">{article.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-wrap gap-3">
                    <ButtonLink href="/iletisim#iletisim-formu" size="sm">
                      <MessageSquare aria-hidden="true" />
                      Bu konuda danışın
                    </ButtonLink>
                    <ButtonLink href={LOCATION_PAGE.href} variant="outline" size="sm">
                      {LOCATION_PAGE.label}
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </Section>

      <ContactCta />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, PATH)} />
    </>
  );
}
