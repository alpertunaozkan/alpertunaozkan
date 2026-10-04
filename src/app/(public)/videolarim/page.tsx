import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/common/container";
import { JsonLd } from "@/components/common/json-ld";
import { Section } from "@/components/common/section";
import { SocialIcon } from "@/components/common/social-icon";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/components/public/breadcrumbs";
import { ContactCta } from "@/components/public/contact-cta";
import { PageHero } from "@/components/public/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { YOUTUBE_CHANNEL_URL } from "@/constants/site";
import { getVideoCategoryFilters } from "@/features/categories/queries";
import { VideoGallery } from "@/features/videos/components/video-gallery";
import { getVideos } from "@/features/videos/queries";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { ORGANIZATION_ID } from "@/lib/structured-data";

const PATH = "/videolarim";

export const metadata = buildPageMetadata({
  title: "Gayrimenkul Hukuku Videoları | Avukat Alper Tuna Özkan",
  description:
    "Gayrimenkul hukukuna dair kısa ve açıklayıcı videolar. Kira, tapu, inşaat sözleşmeleri ve kamulaştırma hakkında bilgilendirici içerikler.",
  path: PATH,
});

const breadcrumbs: BreadcrumbItem[] = [{ label: "Ana Sayfa", href: "/" }, { label: "Videolarım" }];

export default async function VideosPage() {
  const [videos, categories] = await Promise.all([getVideos(), getVideoCategoryFilters()]);
  const pageUrl = absoluteUrl(PATH);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#page`,
    url: pageUrl,
    name: "Gayrimenkul Hukuku Videoları",
    isPartOf: { "@id": ORGANIZATION_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: videos.length,
      itemListElement: videos.map((video, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "VideoObject",
          "@id": `${pageUrl}#${video.id}`,
          name: video.title,
          description: video.description,
          uploadDate: video.publishedAt,
          thumbnailUrl: [absoluteUrl(video.coverImage.url)],
          embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
          duration: video.durationSeconds ? `PT${video.durationSeconds}S` : undefined,
          inLanguage: "tr",
          publisher: { "@id": ORGANIZATION_ID },
        },
      })),
    },
  };

  return (
    <>
      <PageHero
        eyebrow="Videolar"
        title="Videolarım"
        description="Gayrimenkul hukukuna dair güncel ve açıklayıcı içerikler."
        breadcrumbs={breadcrumbs}
      >
        <ButtonLink href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" variant="outline">
          <SocialIcon platform="youtube" className="size-4 text-red-600" />
          YouTube kanalımı ziyaret edin
          <ArrowUpRight aria-hidden="true" />
        </ButtonLink>
      </PageHero>
      <Section className="pt-10 sm:pt-12 lg:pt-14">
        <Container>
          <VideoGallery videos={videos} categories={categories} />
        </Container>
      </Section>
      <ContactCta />
      <JsonLd data={[collectionJsonLd, breadcrumbJsonLd(breadcrumbs, PATH)]} />
    </>
  );
}
