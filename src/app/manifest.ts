import type { MetadataRoute } from "next";
import { SITE } from "@/constants/site";

/** Eski projedeki site.webmanifest içeriği. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.manifestDescription,
    lang: "tr",
    dir: "ltr",
    scope: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: SITE.themeColor,
    icons: [
      { src: "/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
