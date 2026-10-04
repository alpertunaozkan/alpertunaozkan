import type { NextConfig } from "next";

type RemotePatterns = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>;

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();

const remotePatterns: RemotePatterns = [
  // Video kapakları YouTube'daki kapak görselleridir; yalnızca bu yol izinlidir.
  { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**", search: "" },
];
if (cloudinaryCloudName) {
  // Makale görselleri: yalnızca bu sitenin Cloudinary hesabı.
  remotePatterns.push({
    protocol: "https",
    hostname: "res.cloudinary.com",
    pathname: `/${cloudinaryCloudName}/image/upload/**`,
    search: "",
  });
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Eski projedeki değerler korundu (ana sayfa slider'ı bu kalite/boyut
    // değerleriyle tasarlandı). Büyük ekranlarda görsellerin 1200px'e
    // sıkışmaması için yalnızca üst uca 1440/1920/2048 eklendi.
    deviceSizes: [
      320, 360, 375, 390, 414, 480, 540, 640, 720, 828, 1080, 1200, 1440, 1920,
      2048,
    ],
    imageSizes: [16, 32, 48, 64, 78, 96, 128, 256, 384],
    qualities: [55, 60, 65, 70, 72, 75, 78, 80],
    remotePatterns,
  },
  async headers() {
    return [
      {
        // Tüm site: temel güvenlik başlıkları. HTTPS zorunluluğu (HSTS) sunucudaki ters vekilde ayarlanır.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
      {
        // Yönetim paneli başka sitelerde çerçeve içinde açılamaz (tıklama hırsızlığına karşı).
        // Aynı başlık için sonraki kural geçerlidir: panelde Referrer-Policy daha sıkıdır.
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
