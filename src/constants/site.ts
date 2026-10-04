/**
 * Site genelindeki sabit bilgiler. İçerikler eski public projeden
 * (av-alper-tuna-ozkan) alınmıştır; tek kaynak burasıdır.
 */

export const SITE = {
  name: "Avukat Alper Tuna Özkan",
  shortName: "Av. Alper Tuna Özkan",
  personName: "Alper Tuna Özkan",
  tagline: "Hukuk & Danışmanlık",
  url: (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.alpertunaozkan.com").replace(/\/+$/, ""),
  locale: "tr_TR",
  description:
    "Kırıkkale'de gayrimenkul hukuku odağında danışmanlık ve dava takibi. Tapu, kira, inşaat sözleşmeleri ve kamulaştırma konuları hakkında bilgi alın.",
  manifestDescription:
    "Avukat Alper Tuna Özkan ile Kırıkkale’de gayrimenkul, inşaat, kira ve kamulaştırma davalarında uzman hukuki danışmanlık.",
  ogImage: "/images/og/og-default.jpg",
  twitterHandle: "@alpertunaozkan",
  themeColor: "#09142f",
} as const;

export const CONTACT = {
  phone: {
    href: "tel:+905340181933",
    e164: "+905340181933",
    display: "+90 (534) 018 19 33",
  },
  email: "av.alpertunaozkan@gmail.com",
  address: {
    lines: [
      "Yaylacık Mahallesi Ulubatlıhasan Caddesi",
      "Aydınlık Apartmanı, No: 22/9",
      "Merkez / Kırıkkale",
    ],
    street: "Yaylacık Mah. Ulubatlıhasan Cad. Aydınlık Apt. No: 22/9",
    district: "Merkez",
    city: "Kırıkkale",
    postalCode: "71100",
    country: "TR",
  },
  workingHours: {
    display: "Pazartesi – Cuma 09:00 – 18:00",
    weekdays: "Pazartesi - Cuma: 09:00 - 18:00",
    weekend: "Hafta sonu: Kapalı",
    opens: "09:00",
    closes: "18:00",
  },
  geo: { lat: 39.8413091, lng: 33.5002971 },
  maps: {
    place:
      "https://www.google.com/maps/place/Avukat+Alper+Tuna+Özkan/@39.8406944,33.4994228,17z/data=!3m1!4b1",
    directions:
      "https://www.google.com/maps/dir/?api=1&destination=39.8413091,33.5002971",
  },
} as const;

export type SocialPlatform = "instagram" | "youtube" | "x";

export const SOCIAL_LINKS: ReadonlyArray<{
  platform: SocialPlatform;
  label: string;
  href: string;
}> = [
  {
    platform: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/av.alpertunaozkan",
  },
  {
    platform: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@av.alpertunaozkan",
  },
  { platform: "x", label: "X (Twitter)", href: "https://x.com/alpertunaozkan" },
];

export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@av.alpertunaozkan";

export const DEVELOPER_CREDIT = {
  label: "Tasarım ve Geliştirme: Buğrahan Umay Şafak",
  href: "https://www.linkedin.com/in/bugrahanumaysafak/",
} as const;

export interface NavItem {
  label: string;
  href: string;
}

export const MAIN_NAV: readonly NavItem[] = [
  { label: "Hakkımda", href: "/hakkimda" },
  { label: "Faaliyet Alanlarım", href: "/faaliyet-alanlarim" },
  { label: "Makalelerim", href: "/makalelerim" },
  { label: "Videolarım", href: "/videolarim" },
  { label: "İletişim", href: "/iletisim" },
];

export const LOCATION_PAGE = {
  href: "/kirikkale-gayrimenkul-avukati",
  label: "Kırıkkale Gayrimenkul Avukatı",
} as const;
