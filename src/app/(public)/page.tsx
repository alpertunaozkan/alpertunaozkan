import { ContactCta } from "@/components/public/contact-cta";
import { SITE } from "@/constants/site";
import { getPublishedArticles } from "@/features/articles/queries";
import { AboutTeaser } from "@/features/home/components/about-teaser";
import { HeroSlider } from "@/features/home/components/hero-slider";
import { LatestContentSection } from "@/features/home/components/latest-content-section";
import { LocalExpertiseSection } from "@/features/home/components/local-expertise-section";
import { PracticeAreasSection } from "@/features/home/components/practice-areas-section";
import { getVideos } from "@/features/videos/queries";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Avukat Alper Tuna Özkan | Anasayfa",
  description: SITE.description,
  socialDescription: "Gayrimenkul hukuku odağında danışmanlık ve dava hizmetleri.",
  path: "/",
});

export default async function HomePage() {
  const [articles, videos] = await Promise.all([getPublishedArticles(3), getVideos(2)]);

  return (
    <>
      <h1 className="sr-only">Avukat Alper Tuna Özkan — Kırıkkale’de gayrimenkul ve miras hukuku</h1>
      <HeroSlider />
      <PracticeAreasSection />
      <AboutTeaser />
      <LocalExpertiseSection />
      <LatestContentSection articles={articles} videos={videos} />
      <ContactCta />
    </>
  );
}
