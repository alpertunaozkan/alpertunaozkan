import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronDown, Mail, Phone, PlayCircle } from "lucide-react";
import { Container } from "@/components/common/container";
import { JsonLd } from "@/components/common/json-ld";
import { Section, SectionHeading } from "@/components/common/section";
import { Breadcrumbs, breadcrumbJsonLd, type BreadcrumbItem } from "@/components/public/breadcrumbs";
import { ContactCta } from "@/components/public/contact-cta";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { CONTACT } from "@/constants/site";
import { ArticleCard } from "@/features/articles/components/article-card";
import { ArticleHero } from "@/features/articles/components/article-hero";
import { ArticleToc } from "@/features/articles/components/article-toc";
import { AuthorBox } from "@/features/articles/components/author-box";
import {
  findRenamedArticleSlug,
  getPublishedArticleBySlug,
  getPublishedArticleSlugs,
  getRelatedArticles,
} from "@/features/articles/queries";
import { VideoThumbnail } from "@/features/videos/components/video-thumbnail";
import { getVideoForArticle } from "@/features/videos/queries";
import { prepareArticleHtml } from "@/lib/article-html";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { ORGANIZATION_ID, PERSON_ID } from "@/lib/structured-data";
import { countWords, truncate } from "@/lib/text";

// Yayındaki makaleler derleme anında üretilir. Sonradan yayınlanan makale ilk
// ziyarette üretilir (yeniden derleme gerekmez); bulunamayan adres 404 döner.
export async function generateStaticParams() {
  const slugs = await getPublishedArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/makalelerim/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Makale Bulunamadı", robots: { index: false, follow: false } };

  return buildPageMetadata({
    title: `${article.title} | Kırıkkale Gayrimenkul Avukatı Alper Tuna Özkan`,
    description: truncate(article.summary, 155),
    path: `/makalelerim/${article.slug}`,
    type: "article",
    publishedTime: article.publishedAt ?? undefined,
    modifiedTime: article.updatedAt,
    image: article.coverImage,
  });
}

export default async function ArticlePage({ params }: PageProps<"/makalelerim/[slug]">) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) {
    // Adresi değiştirilmiş makalenin eski bağlantısı yeni adrese kalıcı olarak yönlenir.
    const renamedTo = await findRenamedArticleSlug(slug);
    if (renamedTo) permanentRedirect(`/makalelerim/${renamedTo}`);
    notFound();
  }

  const [related, video] = await Promise.all([getRelatedArticles(article, 3), getVideoForArticle(article.slug)]);
  const { html, toc } = prepareArticleHtml(article.content);
  const path = `/makalelerim/${article.slug}`;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Ana Sayfa", href: "/" },
    { label: "Makalelerim", href: "/makalelerim" },
    { label: article.title },
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${absoluteUrl(path)}#article`,
    headline: article.title,
    description: truncate(article.summary, 155),
    image: [absoluteUrl(article.coverImage.url)],
    datePublished: article.publishedAt ?? article.createdAt,
    dateModified: article.updatedAt,
    url: absoluteUrl(path),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    author: [{ "@type": "Person", "@id": PERSON_ID, name: "Alper Tuna Özkan", url: absoluteUrl("/hakkimda") }],
    publisher: { "@id": ORGANIZATION_ID },
    articleSection: article.category?.name,
    keywords: article.keywords.join(", "),
    wordCount: countWords(article.content),
    timeRequired: `PT${article.readingMinutes}M`,
    inLanguage: "tr-TR",
  };

  return (
    <>
      <article aria-labelledby="makale-baslik">
        <ArticleHero
          article={article}
          titleId="makale-baslik"
          breadcrumbs={<Breadcrumbs items={breadcrumbs} />}
          preloadCover
        />

        <Section className="pt-12 sm:pt-16 lg:pt-20">
          <Container className="grid gap-12 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-8">
              {toc.length > 1 ? (
                <details className="disclosure group mb-8 rounded-xl border border-navy-900/10 bg-cream-50 lg:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-navy-950 [&::-webkit-details-marker]:hidden">
                    İçindekiler
                    <ChevronDown className="size-4 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                  </summary>
                  <ArticleToc items={toc} className="px-5 pb-5 [&>p]:hidden [&_ol]:mt-0" />
                </details>
              ) : null}

              <div className="prose-legal" dangerouslySetInnerHTML={{ __html: html }} />

              {article.keywords.length > 0 ? (
                <div className="mt-12 border-t border-navy-900/10 pt-8">
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">Anahtar kelimeler</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {article.keywords.map((keyword) => (
                      <li key={keyword}>
                        <Badge tone="outline" className="px-3 py-1 text-left text-[13px] whitespace-normal">
                          {keyword}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-10">
                <AuthorBox />
              </div>

              {video ? (
                <Link
                  href={`/videolarim#${video.id}`}
                  className="group mt-6 flex flex-col overflow-hidden rounded-2xl border border-navy-900/[0.08] bg-white shadow-card transition-shadow hover:shadow-elevated sm:flex-row"
                >
                  <VideoThumbnail video={video} sizes="(min-width: 640px) 18rem, 100vw" className="sm:w-72 sm:shrink-0" />
                  <div className="flex flex-col justify-center p-6">
                    <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-gold-700 uppercase">
                      <PlayCircle className="size-4" aria-hidden="true" />
                      Bu konuyu videodan izleyin
                    </p>
                    <p className="mt-2 font-serif text-lg leading-snug font-semibold text-navy-950 group-hover:text-navy-700">
                      {video.title}
                    </p>
                  </div>
                </Link>
              ) : null}
            </div>

            <aside className="hidden lg:col-span-4 lg:block">
              <div className="sticky top-28 max-h-[calc(100dvh-8rem)] space-y-6 overflow-y-auto overscroll-contain pb-2">
                <ArticleToc items={toc} className="rounded-2xl border border-navy-900/[0.08] bg-white p-6" />
                <div className="rounded-2xl bg-navy-950 p-6 text-white">
                  <p className="font-serif text-lg font-semibold">Bu konuda hukuki destek alın</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Randevu ve bilgi talebi için bizi arayın veya form üzerinden mesaj bırakın.
                  </p>
                  <div className="mt-5 grid gap-2">
                    <ButtonLink href={CONTACT.phone.href} variant="gold" size="sm">
                      <Phone aria-hidden="true" />
                      {CONTACT.phone.display}
                    </ButtonLink>
                    <ButtonLink href="/iletisim#iletisim-formu" variant="outline-light" size="sm">
                      <Mail aria-hidden="true" />
                      İletişim Formu
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </aside>
          </Container>
        </Section>
      </article>

      {related.length > 0 ? (
        <Section tone="cream" aria-labelledby="ilgili-makaleler">
          <Container>
            <SectionHeading id="ilgili-makaleler" eyebrow="Okumaya devam edin" title="İlgili Makaleler" />
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <ArticleCard article={item} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <ContactCta />
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd(breadcrumbs, path)]} />
    </>
  );
}
