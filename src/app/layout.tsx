import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import { SITE } from "@/constants/site";
import { VIEW_TRANSITION_ABORT_FIX } from "@/lib/view-transition-abort-fix";
import "./globals.css";

// Eski sitedeki gibi Inter, --font-sans değişkeniyle <html>'e bağlanır
// (slider tipografisi bu fonta göre tasarlandı).
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.name,
  description: SITE.description,
  applicationName: SITE.name,
  category: "legal",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/images/brand/logo.svg", color: "#b88d2a" }],
  },
  openGraph: {
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: { card: "summary_large_image", site: SITE.twitterHandle },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: SITE.themeColor,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${sourceSerif.variable} antialiased`}
    >
      <body className="bg-white text-navy-950">
        {children}
        <Script
          id="view-transition-abort-fix"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: VIEW_TRANSITION_ABORT_FIX }}
        />
      </body>
    </html>
  );
}
