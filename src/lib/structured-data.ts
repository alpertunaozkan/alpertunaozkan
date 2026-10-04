import { CONTACT, SITE, SOCIAL_LINKS } from "@/constants/site";
import { absoluteUrl } from "./seo";

export const ORGANIZATION_ID = `${SITE.url}/#org`;
export const PERSON_ID = `${SITE.url}/hakkimda#person`;

const postalAddress = {
  "@type": "PostalAddress",
  streetAddress: CONTACT.address.street,
  addressLocality: CONTACT.address.district,
  addressRegion: CONTACT.address.city,
  postalCode: CONTACT.address.postalCode,
  addressCountry: CONTACT.address.country,
} as const;

const openingHours = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
      (day) => `https://schema.org/${day}`,
    ),
    opens: CONTACT.workingHours.opens,
    closes: CONTACT.workingHours.closes,
  },
] as const;

/** Site geneli: hukuk bürosu (LegalService) varlığı. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": ORGANIZATION_ID,
    name: SITE.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icons/android-chrome-512x512.png"),
    image: absoluteUrl(SITE.ogImage),
    description: SITE.description,
    telephone: CONTACT.phone.e164,
    email: CONTACT.email,
    address: postalAddress,
    geo: { "@type": "GeoCoordinates", latitude: CONTACT.geo.lat, longitude: CONTACT.geo.lng },
    hasMap: CONTACT.maps.place,
    openingHoursSpecification: openingHours,
    areaServed: { "@type": "City", name: CONTACT.address.city },
    sameAs: SOCIAL_LINKS.map((social) => social.href),
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE.personName,
    jobTitle: "Avukat",
    url: absoluteUrl("/hakkimda"),
    image: absoluteUrl("/images/profile/alper-tuna-ozkan-portre.webp"),
    worksFor: { "@id": ORGANIZATION_ID },
    alumniOf: { "@type": "CollegeOrUniversity", name: "Ufuk Üniversitesi Hukuk Fakültesi" },
    birthPlace: { "@type": "Place", name: "Kırıkkale" },
    knowsAbout: ["Gayrimenkul Hukuku", "Miras Hukuku", "Kira Hukuku", "İnşaat Hukuku", "Kamulaştırma ve İmar Hukuku"],
    sameAs: SOCIAL_LINKS.map((social) => social.href),
  };
}
