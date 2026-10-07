/** Hakkımda sayfası içeriği — eski projedeki AboutMe bileşeninden alınmıştır. */

export const ABOUT_BIO: string[] = [
  "1994 yılında Kırıkkale’de doğan Alper Tuna Özkan, hukuka olan tutkusu ve çözüm odaklı yaklaşımıyla kariyerini şekillendirmiştir. 2019 yılında Ufuk Üniversitesi Hukuk Fakültesi’nden mezun olduktan sonra, özellikle gayrimenkul ve miras hukuku alanlarında derin bir uzmanlık geliştirmiş ve karmaşık hukuki meselelerde müvekkillerine somut ve güvenilir çözümler sunmayı ilke edinmiştir.",
  "Kariyeri boyunca, vatandaşların yıllardır idare ile süren mülkiyet ve kamulaştırmasız el atma davalarında etkili çözümler üreterek haklarını korumuş; müteahhit firmalar ve arsa sahipleriyle yürütülen kat karşılığı inşaat ve kentsel dönüşüm projelerinde süreçleri stratejik şekilde yönetmiştir. Bu çalışmalar, onu sektörde uzman bir avukat olarak ön plana çıkarmıştır.",
  "Alper Tuna Özkan, özellikle gayrimenkul ve miras hukuku alanlarında müvekkillerine rehberlik etmekte, taşınmaz mülkiyeti, tapu iptali ve tescil ile miras yoluyla intikal eden taşınmazlardaki paydaş ihtilaflarını etkin biçimde çözmektedir. Aynı zamanda kira hukuku ve mülkiyetle bağlantılı diğer uyuşmazlıklarda da stratejik ve pratik çözümler üreterek müvekkillerinin haklarını güvence altına almaktadır.",
  "Her vakaya derin bir özenle yaklaşan Av. Alper Tuna Özkan, hukuki süreçleri sadece dava gözüyle değerlendirmekle kalmayıp, stratejik ve pratik çözümler geliştirerek müvekkillerinin haklarını korumakta ve hukuki süreçlerini etkin şekilde yönetmektedir. Etik ve profesyonel yaklaşımı, derin alan bilgisi ve çözüm odaklı çalışmasıyla, gayrimenkul ve miras hukuku alanında uzman bir avukat olarak öne çıkmaktadır.",
];

/** Biyografinin son paragrafında vurgulanan çalışma ilkeleri. */
export const ABOUT_PRINCIPLES = [
  {
    title: "Etik ve profesyonel yaklaşım",
    description:
      "Her vakaya derin bir özenle yaklaşılır; süreçler etik ilkeler çerçevesinde, müvekkil bilgilendirilerek yürütülür.",
  },
  {
    title: "Derin alan bilgisi",
    description:
      "Taşınmaz mülkiyeti, tapu iptali ve tescil ile miras yoluyla intikal eden taşınmazlardaki paydaş ihtilaflarına odaklanılır.",
  },
  {
    title: "Çözüm odaklı çalışma",
    description:
      "Hukuki süreçler yalnızca dava gözüyle değerlendirilmez; stratejik ve pratik çözümler geliştirilir.",
  },
] as const;

export const OFFICE_PHOTOS = [
  {
    src: "/images/office/calisma-odasi.webp",
    alt: "Kırıkkale ofisinde görüşme alanı ve çalışma masası",
    caption: "Çalışma odası",
    width: 1360,
    height: 1020,
  },
  {
    src: "/images/office/kitaplik.webp",
    alt: "Kırıkkale ofisinde hukuk kitaplarının bulunduğu kütüphane",
    caption: "Kütüphane",
    width: 800,
    height: 1020,
  },
  {
    src: "/images/office/toplanti-odasi.webp",
    alt: "Kırıkkale ofisinde toplantı odası",
    caption: "Toplantı odası",
    width: 765,
    height: 1020,
  },
] as const;
