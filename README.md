# Avukat Alper Tuna Özkan — Web Sitesi ve Yönetim Paneli

Public site ve yönetim paneli **tek bir Next.js uygulamasıdır**. Panel yalnızca
`/admin` altından erişilir; ayrı bir portal projesi, API sunucusu, subdomain veya
deployment yoktur.

Veriler **MongoDB Atlas**'ta, makale görselleri **Cloudinary**'de tutulur (eski
projeyle aynı servisler). Panele yalnızca **tek bir yönetici** (Av. Alper Tuna Özkan)
kullanıcı adı ve şifreyle girer; kayıt olma ve şifre sıfırlama yoktur. Uygulama,
ortam değişkenleri (`.env.local`) doldurulmadan veri gösteremez — bkz. [Kurulum](#kurulum).

## Teknoloji

- Next.js 16 (App Router, Turbopack, React Compiler) · React 19 · TypeScript 6 (strict)
- Tailwind CSS 4 · ESLint 9 (eslint-config-next)
- Sunucu: `mongodb` (resmî sürücü; Mongoose yok), `cloudinary` (imza ve görsel
  listesi), `linkedom` (makale içeriğini temizlemek için HTML ayrıştırıcı), `zod`
- Arayüz: `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`,
  Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extensions`, `@tiptap/pm` —
  yalnızca paneldeki makale editörü). Başka UI/state kütüphanesi yoktur (modallar
  native `<dialog>`).
- Geliştirme: `tsx` (yalnızca `scripts/` altındaki komut satırı betikleri için)

## Gereksinimler

- **Node.js 24 LTS** — `.nvmrc` içinde tanımlı (`nvm use`).
- **pnpm 12** — sürüm `package.json` içindeki `packageManager` alanıyla sabittir;
  corepack açıksa (`corepack enable`) doğru sürüm otomatik kullanılır. npm/yarn
  kullanılmaz (`pnpm-lock.yaml` tek kilit dosyasıdır).
- MongoDB Atlas kümesi ve Cloudinary hesabı (eski projede kullanılanlar).

## Kurulum

1. `pnpm install`
2. `.env.example` dosyasını `.env.local` adıyla kopyalayın ve değerleri doldurun
   (`.env.local` git'e eklenmez; gerçek değerler hiçbir zaman `.env.example`'a yazılmaz):
   - `MONGODB_URI` (+ isteğe bağlı `MONGODB_DB`): Atlas bağlantı adresi. Atlas →
     *Network Access* listesinde uygulamanın (ve derlemenin) çalıştığı makinenin IP'si
     olmalıdır.
   - `ADMIN_USERNAME`: avukatın giriş kullanıcı adı.
   - `ADMIN_PASSWORD_HASH`: şifrenin **özeti**. `pnpm admin:hash-password` komutu şifreyi
     (ekranda göstermeden, iki kez) sorar ve özeti doğrudan `.env.local`'a yazar. Şifre en
     az 12 karakter olmalıdır; şifrenin kendisi hiçbir yere kaydedilmez.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
     (+ `CLOUDINARY_ARTICLE_FOLDER`, varsayılan `articles`).
3. `pnpm dev` → http://localhost:3000, panel: http://localhost:3000/admin

Bir ortam değişkeni eksik veya hatalıysa ilgili işlem `[ortam] … ayarları eksik veya
hatalı: … Bkz. .env.example` hatasıyla durur (değerler ilk kullanıldıkları anda,
`zod` ile doğrulanır: `src/server/env.ts`).

## Komutlar

```bash
pnpm dev                    # http://localhost:3000
pnpm build                  # production derlemesi (veritabanı erişimi gerekir, aşağıya bkz.)
pnpm start                  # derlenmiş uygulamayı çalıştırır
pnpm lint
pnpm typecheck              # next typegen + tsc --noEmit
pnpm admin:hash-password    # yönetici şifresini belirler (.env.local'a yazar; --print: yalnızca yazdırır)
```

### Bağımlılık notları

- pnpm, bağımlılıkların kurulum betiklerini yalnızca `pnpm-workspace.yaml` içindeki
  `allowBuilds` listesinde izin verilmişse çalıştırır. Yeni bir paket betik
  getirirse kurulum durur; paket bu listeye `true` (çalıştır) veya `false`
  (çalıştırma) olarak eklenmelidir. (`unrs-resolver` ve `esbuild` betikleri yalnızca
  platform paketini doğrular; pnpm o paketleri zaten kurduğu için `false`.)
- **TypeScript 7** henüz kullanılamıyor: `eslint-config-next` içindeki
  `typescript-eslint` en fazla TypeScript 6.0'ı destekliyor (bu yüzden `~6.0.x`).
- **ESLint 10** henüz kullanılamıyor: `eslint-config-next` içindeki
  `eslint-plugin-react`, `eslint-plugin-import` ve `eslint-plugin-jsx-a11y` en fazla
  ESLint 9'u destekliyor. npm, ESLint 9'u "artık desteklenmiyor" olarak işaretliyor;
  bu uyarı `eslint-config-next` ESLint 10'u destekleyene kadar beklenen bir durumdur.
- `@types/node` sürümü, kullanılan Node.js ana sürümüyle (24) aynı tutulur.

## Rotalar

| Public | Panel |
| --- | --- |
| `/` | `/admin` → `/admin/dashboard` |
| `/hakkimda` | `/admin/login` |
| `/faaliyet-alanlarim` | `/admin/dashboard` |
| `/makalelerim`, `/makalelerim/[slug]` | `/admin/makaleler`, `/admin/makaleler/yeni`, `/admin/makaleler/[id]` |
| `/videolarim` | `/admin/videolar` |
| `/iletisim` | `/admin/kategoriler` |
| `/kirikkale-gayrimenkul-avukati` (eski sitedeki SEO sayfası korundu) | `/admin/iletisim` |

Ayrıca: `/sitemap.xml`, `/robots.txt` (`/admin` taranmaz), `/manifest.webmanifest`.
Makale adresleri (slug) eski sitedekilerle aynıdır.

## Klasör yapısı

```
deploy/
├── nginx/alpertunaozkan.conf          # HTTPS, www yönlendirmesi, eski panel adresi, gerçek IP iletimi
└── systemd/alpertunaozkan.service     # uygulamayı sunucuda ayakta tutan hizmet
scripts/
└── hash-password.ts        # pnpm admin:hash-password
src/
├── app/
│   ├── (public)/           # public sayfalar (header/footer layout'u)
│   ├── admin/
│   │   ├── login/          # giriş ekranı
│   │   └── (panel)/        # sidebar'lı panel sayfaları (layout oturumu doğrular)
│   ├── api/makale-goruntulenme/  # makale görüntülenme sayacı (POST)
│   ├── layout.tsx          # kök layout (fontlar, varsayılan metadata)
│   └── sitemap.ts, robots.ts, manifest.ts, not-found.tsx, error.tsx
├── proxy.ts                # /admin için hızlı ön kontrol (oturum çerezi yoksa girişe yönlendirir)
├── server/                 # yalnızca sunucuda çalışan altyapı
│   ├── env.ts              # ortam değişkenleri (zod ile doğrulanır)
│   ├── db.ts               # MongoDB bağlantısı (süreç başına tek istemci)
│   ├── documents.ts        # koleksiyonlar, belge tipleri, indeksler
│   ├── mappers.ts          # belge → uygulama tipi dönüşümleri
│   ├── dal.ts              # requireAdmin(): her panel sorgusu ve işleminde yetki kontrolü
│   ├── action.ts           # Server Action yardımcıları (hata yönetimi, site yenileme)
│   ├── auth/               # şifre özeti (scrypt), oturumlar, çerez adı
│   ├── rate-limit.ts       # veritabanı tabanlı istek sınırlayıcı
│   ├── cloudinary.ts       # yükleme imzası, görsel kütüphanesi
│   └── youtube.ts          # video kapağının YouTube'dan bulunması
├── features/<alan>/        # articles, videos, categories, contacts, dashboard, auth, media, ...
│   ├── queries.ts          # okuma (sunucu): public sorgular + panel sorguları (requireAdmin)
│   ├── actions.ts          # yazma: Server Actions ("use server"; requireAdmin + zod doğrulama)
│   ├── schema.ts           # zod doğrulama şemaları (panel ve sunucu ortak kullanır)
│   ├── hooks/              # panel ekranlarının veri/işlem hook'ları (işlemleri çağırır)
│   └── components/         # alanın public ve admin bileşenleri
├── data/                   # statik site içeriği (slider, faaliyet alanları, hakkımda, Kırıkkale sayfası)
├── types/                  # alan tipleri (Article, Video, Category, ContactMessage, DashboardStats, ...)
├── constants/site.ts       # iletişim bilgileri, navigasyon, sosyal bağlantılar
└── lib/                    # yardımcılar (format, slugify, SEO, JSON-LD, YouTube, makale içeriği)
```

## Veri akışı

- **Okuma:** sayfalar `src/features/*/queries.ts` fonksiyonlarını sunucuda çağırır
  (`getPublishedArticles`, `getPublishedArticleBySlug`, `getVideos`, `getCategories`, …).
  Panel sorguları (`getArticlesForAdmin`, `getContactMessages`, `getDashboardStats`, …)
  önce `requireAdmin()` çağırır. İstemciye yalnızca `mappers.ts` ile dönüştürülmüş
  nesneler gider (ham belge, `ObjectId`, `Date` gitmez).
- **Yazma:** panel `src/features/*/actions.ts` içindeki Server Action'ları çağırır
  (hook'lar: `features/*/hooks/use-*-admin.ts`). Her işlem oturumu kendisi doğrular,
  girdiyi zod ile **sunucuda yeniden** doğrular ve beklenen hataları (çakışan adres,
  silinmiş kategori, …) alan hatalarıyla birlikte döndürür; beklenmeyen hatalar sunucu
  günlüğüne yazılır, kullanıcıya genel bir mesaj gider.
- **Panel durumu:** `src/features/admin/admin-data-provider.tsx` panel açılırken
  sunucudan gelen veriyle başlar; her işlemin sonucu (kaydedilen kayıt) buraya
  işlenir, sayfa yenilemeye gerek kalmaz.
- **Public sayfalar** derleme anında üretilir (statik) ve panelde bir değişiklik
  kaydedildiğinde yenilenir (`revalidatePublicSite()`: tüm public sayfalar ve site
  haritası). Sonradan yayınlanan makalenin sayfası ilk ziyarette üretilir.
- **İletişim formu** (`src/features/contacts/submit-contact.ts`): sunucuda doğrulanır,
  gizli bir tuzak alanı (bot koruması) ve IP başına saatte 5 mesaj sınırı vardır; mesaj
  "okunmamış" olarak kaydedilir.
- **Makale görüntülenme sayısı** (`src/app/api/makale-goruntulenme/route.ts`): makale
  sayfası tarayıcıda açılınca `ArticleViewTracker` sayacı bir artırır (`articles.viewCount`).
  Aynı sekmede tekrar açılış, botlar, panelde oturumu açık yönetici, sitenin kendi
  adresinden gelmeyen istekler (yerel geliştirme dahil) ve IP başına saatte 30'u aşan
  istekler sayılmaz. Çerez kullanılmaz, IP veritabanına yazılmaz. Sayılar yalnızca panelde
  (Makaleler listesi, Genel Bakış) görünür; public sayfalar statik kalır.

### Veritabanı

Koleksiyonlar ve belge şemaları `src/server/documents.ts` içindedir. İndeksler uygulama
ilk bağlandığında oluşturulur.

| Koleksiyon | İçerik | Önemli indeksler |
| --- | --- | --- |
| `articles` | makaleler (taslak/yayında, görüntülenme sayısı) | `slug` benzersiz, `previousSlugs`, `status + publishedAt` |
| `categories` | kategoriler | `slug` benzersiz, `name` benzersiz (Türkçe, büyük/küçük harf duyarsız) |
| `videos` | YouTube videoları | `youtubeId` benzersiz |
| `contact_messages` | iletişim formu mesajları | `createdAt` |
| `admin_sessions` | yönetici oturumları | `tokenHash` benzersiz, süresi dolan otomatik silinir (TTL) |
| `rate_limits` | deneme sayaçları | süresi dolan otomatik silinir (TTL) |

### Görseller (Cloudinary)

- Panelde "Bilgisayardan seç": tarayıcı dosyayı **doğrudan Cloudinary'ye** yükler;
  sunucu yalnızca kısa ömürlü bir imza verir (`getUploadSignatureAction`). API gizli
  anahtarı tarayıcıya hiç gitmez. Yalnızca görsel biçimleri (JPG, PNG, WebP, AVIF, HEIC)
  ve en fazla 10 MB kabul edilir. Cloudinary görselin genişlik/yüksekliğini döndürür;
  bu değerler makaleyle birlikte saklanır.
- "Kütüphaneden seç": `CLOUDINARY_ARTICLE_FOLDER` klasöründeki görseller listelenir.
- Kapak olarak yalnızca bu hesabın Cloudinary görselleri kabul edilir. Site görselleri
  Next.js görsel optimizasyonuyla sunar; izinli adresler `next.config.ts` →
  `images.remotePatterns` (yalnızca `res.cloudinary.com/<CLOUDINARY_CLOUD_NAME>/image/upload/…`
  ve YouTube kapakları). Bu yüzden `CLOUDINARY_CLOUD_NAME` **derleme ortamında da**
  tanımlı olmalıdır.
- Makale silinince veya kapağı değişince görsel Cloudinary'den **silinmez**
  (kütüphaneden yeniden kullanılabilir; geçiş döneminde eski siteyle ortaktır).

### Videolar

Panel kapak görseli göndermez. Video eklenirken veya YouTube ID'si değişince sunucu,
YouTube'daki kapağı eski API'deki sırayla bulur (`maxresdefault` → `sddefault` →
`hqdefault`) ve boyutlarıyla kaydeder; YouTube'da bulunamayan video kaydedilmez.
Kayıtlı çeşit YouTube'da sonradan kaldırılırsa kart otomatik olarak alttaki çeşide
geçer (`VideoCover`, `video-thumbnail.tsx`). Panel aynı mantıkla
(`src/features/videos/youtube-cover.ts`) önizleme gösterir.

### Makale içeriği (güvenlik ve uyum)

İçerik hem **kaydedilirken** (`actions.ts`) hem **okunurken** (`queries.ts`)
`normalizeArticleContent()` ile temizlenir (`src/lib/article-content.ts`; sunucuda
`linkedom`, panel önizlemesinde tarayıcı aynı kodu çalıştırır). İzinli etiketler: `p`,
`h2`, `h3`, `ul`, `ol`, `li`, `strong`, `em`, `u`, `s`, `a` (yalnızca güvenli `href`:
http/https/mailto/tel, site içi `/…` ve `#…`), `blockquote`, `br`; diğerleri ve tüm
nitelikler atılır, `script`/`iframe` vb. içerikleriyle silinir. Eski editörün (Quill 2)
çıktısı da uyarlanır: `<ol><li data-list="bullet">` listeleri doğru madde/numara
listesine çevrilir, boş başlıklar atılır, etiketsiz düz metin paragraflara bölünür.

**Adres değişimi:** yayındaki makalenin adresi (slug) değiştirilirse eski adres
`previousSlugs` içinde saklanır ve yeni adrese kalıcı olarak (308) yönlenir; bu adrese
bağlı videolar da yeni adrese taşınır.

## Yönetici girişi

- Tek hesap: `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` (scrypt; Node.js'in yerleşik,
  bellek-yoğun algoritması). Kullanıcı adı ve şifre sabit sürede karşılaştırılır;
  hatalı girişte hangisinin yanlış olduğu söylenmez.
- Aynı IP'den 15 dakikada en fazla **5 hatalı deneme**; son denemelerde kalan hak
  gösterilir, sınır dolunca 15 dakika beklenir.
- Oturum: çerezde rastgele bir anahtar (`__Host-admin-session`; HttpOnly, Secure,
  SameSite=Lax), veritabanında yalnızca bu anahtarın özeti tutulur. Süre 7 gündür.
  **Çıkış yap** oturumu veritabanından siler; eski çerez tekrar kullanılamaz.
- Yetki kontrolü katmanlıdır: `src/proxy.ts` çerezi olmayanı giriş sayfasına
  yönlendirir (ön kontrol); asıl doğrulama panel layout'unda, her panel sorgusunda ve
  her Server Action'da `requireAdmin()` ile veritabanından yapılır.
- Panel sayfaları başka sitelerde çerçeve içinde açılamaz (`X-Frame-Options: DENY`).

**Şifre değiştirmek:** `pnpm admin:hash-password` yeni özeti `.env.local`'a yazar
(sunucuda: `pnpm admin:hash-password --print` çıktısını sunucunun ortam değişkenine
yazın) ve uygulamayı yeniden başlatın. Oturumlar açıldıkları andaki giriş bilgilerine
bağlı olduğundan **eski oturumların hepsi kendiliğinden kapanır** (başka bir cihazda
açık kalmış oturum dahil).

## Sunucuya kurulum (VPS)

Örnek yapılandırmalar `deploy/` klasöründedir; yollar ve kullanıcı gerekirse uyarlanır.
Proje komutları (`pnpm …`) hizmetin kullanıcısıyla çalıştırılır (ör. `sudo -u www-data pnpm build`);
böylece `.next` çıktısının sahibi hizmetle aynı olur.

1. Sunucuda Node.js 24, `corepack enable` (pnpm), nginx ve certbot kurulu olmalıdır.
2. Kod: `git clone https://github.com/alpertunaozkan/alpertunaozkan.git /var/www/alpertunaozkan`
   (dizinin sahibi `www-data`).
3. Ortam: projeye `.env.local` oluşturulur (yereldeki değerlerle aynı; izinleri `600`,
   sahibi `www-data`). Yönetici şifresi sunucuda `pnpm admin:hash-password` ile de
   belirlenebilir.
4. Bağımlılıklar: `pnpm install --frozen-lockfile`.
5. Derleme: `pnpm build`.
6. Hizmet: `deploy/systemd/alpertunaozkan.service` → `/etc/systemd/system/`, ardından
   `sudo systemctl daemon-reload && sudo systemctl enable --now alpertunaozkan`.
7. nginx: `deploy/nginx/alpertunaozkan.conf` etkinleştirilir, sertifika alınır (dosyadaki
   certbot komutu), `sudo nginx -t && sudo systemctl reload nginx`.

**Güncelleme:** (`www-data` kullanıcısıyla) `git pull && pnpm install --frozen-lockfile && pnpm build`,
ardından `sudo systemctl restart alpertunaozkan`.

## Yayına alma notları

- **Derleme veritabanına erişir:** public sayfalar derleme anında üretildiği için
  `pnpm build` sırasında `MONGODB_URI` (ve görsel adresleri için `CLOUDINARY_CLOUD_NAME`)
  tanımlı, Atlas'a erişim açık olmalıdır.
- **HTTPS zorunludur:** oturum çerezi `__Host-` önekli ve `Secure`'dur; üretimde HTTP
  üzerinden giriş yapılamaz. HTTP istekleri HTTPS'e yönlendirilmeli ve HSTS başlığı ters
  vekilde ayarlanmalıdır (ör. `add_header Strict-Transport-Security "max-age=31536000" always;`).
  Diğer temel güvenlik başlıkları uygulamadan gelir (`next.config.ts` → `headers`).
- **Ters vekil (nginx vb.) arkasında** çalışılacaksa gerçek istemci IP'si `X-Real-IP`
  başlığıyla iletilmelidir (ör. `proxy_set_header X-Real-IP $remote_addr;`). Bu başlık
  vekil tarafından ayarlanmazsa istemci IP'yi kendisi yazabileceği için giriş ve form
  deneme sınırları IP başına doğru çalışmaz. (Vercel bu başlığı kendisi ayarlar.)
- Uygulama birden fazla sunucu/örnekte çalışacaksa hepsinde aynı
  `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` tanımlanmalıdır.

## Makale editörü ve kapak görselleri

**İçerik editörü** (`src/features/articles/components/admin/content-editor.tsx`, Tiptap)
"gördüğün gibi" çalışır: avukat HTML etiketi görmez; metin, sitedeki makale sayfasıyla
**aynı yazı stiliyle** (`.prose-legal`) görünür. Araç çubuğu: Normal metin / Başlık /
Alt başlık, kalın, italik, altı çizili, üstü çizili, madde ve numaralı liste, alıntı,
bağlantı, biçimlendirmeyi temizle, geri al / yinele. Kaydedilen değer eskisi gibi temiz
HTML'dir.

- **Yapıştırma:** Word / Google Dokümanlar'dan yapıştırılan metin sitenin yapısına
  uyarlanır: Başlık 1 → Başlık, Başlık 4–6 → Alt başlık, masaüstü Word listeleri →
  gerçek liste, tablolar → satır satır paragraf ("hücre – hücre"), paragraflar arasındaki
  boş satırlar atılır. Renk, yazı tipi, boyut, hizalama gibi biçimler sitede
  kullanılmadığı için alınmaz.
- **Önizle** düğmesi makaleyi (kaydedilmemiş değişiklikler dahil) sitedeki üst bölüm,
  kapak ve içerik bileşenleriyle birebir gösterir.
- Mevcut içerik editörde kayıpsız açılır (eski editörün biçimi veri katmanında
  uyarlanır, bkz. [Makale içeriği](#makale-içeriği-güvenlik-ve-uyum)).
- **Birebir görünüm:** sitedeki metin kuralları editörle aynıdır (`.prose-legal`): yazarın
  boşlukları korunur (editör kayıtlı içeriği `preserveWhitespace` ile açar), uzun
  kelime/adresler satıra sığacak şekilde bölünür, bitişik harf kullanılmaz. Aynı
  genişlikte editördeki ve sitedeki her bloğun konumu ve yüksekliği aynıdır.

**Kapak görselleri her oranda olabilir** (yatay, dikey, kare, panoramik). Görselin
`width`/`height` değerleri `ImageAsset` içinde tutulur (yüklemede Cloudinary döndürür):

- **Kartlar** (makale listesi, ana sayfa, ilgili makaleler, video kartları, panel
  listesi) sabit çerçeve kullanır; ızgara hizası bozulmaz. Oranı çerçeveye yakın
  görseller çerçeveyi doldurur, diğerleri **kırpılmadan** ortalanır ve boşluk aynı
  görselin bulanık bir kopyasıyla doldurulur (`src/components/common/framed-image.tsx`).
- **Makale sayfası** kapağı görselin kendi oranında gösterir (0,6–2,4 arasına
  sınırlanır, yükseklik ekranın %72'sini geçmez) — `article-cover.tsx`.
- **Boyutu bilinmeyen görsel** (ör. Cloudinary bilgisi alınamamış eski kayıt): kartlar
  görsel yüklenince gerçek oranı ölçüp ona göre yerleştirir; makale sayfası 16:9
  çerçevede kırpmadan gösterir (sayfa kaymaz).
- **Open Graph** etiketleri görselin gerçek boyutlarını bildirir (bilinmiyorsa yazılmaz).
- **Alternatif metin** görselle birlikte değişir (anlamlı dosya adı önerilir;
  "IMG_1234", "WhatsApp Image …" gibi adlar önerilmez). Avukatın elle yazdığı açıklama,
  görsel değişse de korunur.

## Animasyonlar

- **Sayfa geçişleri:** `src/components/common/page-transition.tsx` — React `<ViewTransition>`
  (View Transitions API). Desteklemeyen tarayıcıda sayfa animasyonsuz değişir.
- **Geçici uyumluluk düzeltmesi:** `src/lib/view-transition-abort-fix.ts` (kök layout'ta
  `beforeInteractive` betik). Geçiş sırasında ekran boyutu değişince tarayıcının iptal ettiği
  geçişi React 19.3, güncel Chrome'un mesajını tanımadığı için hata olarak raporluyor; betik
  yalnızca bu mesajı düzeltir. React bu durumu düzelttiğinde kaldırılabilir.
- **Mobil menü, modallar, panel yan menüsü, açılır içerikler (`<details>`), seçim
  listeleri:** `src/app/globals.css` → "Etkileşim animasyonları" bölümü. Seçim
  listeleri, tarayıcı destekliyorsa (`appearance: base-select`) sitenin tasarımıyla açılır.
- **Modallar:** `src/components/ui/use-dialog-presence.ts` kapanış animasyonu bitene kadar
  içeriği DOM'da tutar.
- Tüm animasyonlar "hareketi azalt" (`prefers-reduced-motion`) tercihinde kapanır.
  Ana sayfa slider'ı bu kurallardan etkilenmez.
- Mobil menü açıkken kaydırma kilidi `<html>` üzerindedir; `<body>`'ye `overflow: hidden`
  verilmemelidir (yapışkan header'ı bozar).

## Ana sayfa slider'ı

`src/features/home/components/hero-slider.tsx` eski projedeki slider'ın **görsel
tasarımı değiştirilmeden** aktarılmış hâlidir; paylaşılan tasarım bileşenlerine bağımlı
değildir. Görünümü etkilemeyen teknik uyarlamalar dosyanın başında listelenmiştir.
Header yüksekliği (72px) slider yüksekliğiyle (`calc(100dvh-72px)`) bağlantılıdır.

## Notlar

- Sitenin sabit görselleri (slider, profil, ofis, OG görseli, logo) eski projeden
  alınmıştır ve `public/images` altındadır. Makale kapakları Cloudinary'den, video
  kapakları YouTube'dan gelir.
- **Geçmiş:** Site 5 Ekim 2026'da eski projenin (Vercel'deki site ve panel, VPS'teki API)
  yerine geçti. Eski API'nin makale, kategori ve video kayıtları bu yapıya aktarıldı
  (adresler korunarak); ardından eski site, panel, API ve eski veriler kaldırıldı.
  Eski panel adresi (`panel.alpertunaozkan.com`) `/admin`'e yönlenir.
- Eski projede tespit edilip **doğrulanması önerilen** tutarsızlıklar:
  - İki farklı adres: iletişim sayfasında "Yaylacık Mah. … Aydınlık Apt. No: 22/9",
    Kırıkkale sayfasında "Fabrikalar Mah. … No: 22". Yeni sitede ilki kullanıldı.
  - JSON-LD'deki `youtube.com/@alpertunaozkan` adresi mevcut değil (404); görünür
    bağlantılardaki `@av.alpertunaozkan` kullanıldı. LinkedIn/Facebook bağlantıları
    genel adreslerdi (`linkedin.com`), eklenmedi.
  - Eski veritabanında "Tapuda Metrekare Eksildi!" kaydı, "Muris Muvazaası" videosunun
    ID'sine (`JaNQf95xeSY`) bağlıydı; aktarımda doğru ID'ye (`YUGONMDWA3M`) düzeltildi.
  - Eski public site, API'nin makaleler için döndürdüğü `publishedAt` yerine `createdAt`
    okuduğundan tarih bulunamayınca "şu an"a düşüyordu (makaleler bugünün tarihiyle
    görünüyordu); yeni site `publishedAt`/`updatedAt` kullanır.
