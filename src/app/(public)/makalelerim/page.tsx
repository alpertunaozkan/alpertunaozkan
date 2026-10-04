import type { Metadata } from "next";
import { Container } from "@/components/common/container";
import { JsonLd } from "@/components/common/json-ld";
import { Section } from "@/components/common/section";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/components/public/breadcrumbs";
import { ContactCta } from "@/components/public/contact-cta";
import { PageHero } from "@/components/public/page-hero";
import { ArticleExplorer } from "@/features/articles/components/article-explorer";
import { getPublishedArticles } from "@/features/articles/queries";
import { getArticleCategoryFilters } from "@/features/categories/queries";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { truncate } from "@/lib/text";

const PATH = "/makalelerim";

const breadcrumbs: BreadcrumbItem[] = [{ label: "Ana Sayfa", href: "/" }, { label: "Makalelerim" }];

export async function generateMetadata(): Promise<Metadata> {
  // Eski sitedeki gibi: açıklama, en yeni makalelerin özetlerinden oluşur.
  const latest = await getPublishedArticles(3);
  const summary = latest.map((article) => article.summary).join(" · ");

  return buildPageMetadata({
    title: "Gayrimenkul Hukuku Makaleleri | Avukat Alper Tuna Özkan",
    description: summary ? truncate(summary, 155) : "Gayrimenkul hukuku üzerine güncel makaleler.",
    path: PATH,
  });
}

export default async function ArticlesPage() {
  const [articles, categories] = await Promise.all([getPublishedArticles(), getArticleCategoryFilters()]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`${PATH}/${article.slug}`),
      name: article.title,
    })),
  };

  return (
    <>
      <PageHero
        eyebrow="Makaleler"
        title="Makalelerim"
        description="Gayrimenkul hukukuna dair kapsamlı yazılar."
        breadcrumbs={breadcrumbs}
      />
      <Section className="pt-10 sm:pt-12 lg:pt-14">
        <Container>
          <ArticleExplorer articles={articles} categories={categories} />
        </Container>
      </Section>
      <ContactCta />
      <JsonLd data={[itemListJsonLd, breadcrumbJsonLd(breadcrumbs, PATH)]} />
    </>
  );
}
