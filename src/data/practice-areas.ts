/**
 * Faaliyet alanları. Başlık, madde listeleri ve açıklamalar eski projenin
 * src/data/service.ts, src/data/slide.ts ve src/data/LocationServices.ts
 * dosyalarından alınmıştır. `id` değerleri eski sayfadaki çapa (anchor)
 * id'leriyle aynıdır: /faaliyet-alanlarim#kira-hukuku gibi.
 */

export type PracticeAreaIcon = "scale" | "building" | "key" | "hammer" | "land";

export interface PracticeArea {
  id: string;
  title: string;
  icon: PracticeAreaIcon;
  /** Uzun açıklama (slider metni). */
  description: string;
  /** Kısa açıklama (Kırıkkale tanıtım bölümündeki özet). */
  summary: string;
  features: string[];
  /** Kart üzerinde öne çıkan maddeler. */
  highlights: string[];
  /** İlişkili makale kategorileri (içerik önerileri için). */
  relatedCategorySlugs: string[];
}

export const practiceAreas: PracticeArea[] = [
  {
    id: "miras-hukuku",
    title: "Miras Hukuku",
    icon: "scale",
    description:
      "Miras yoluyla intikal eden taşınmazlarda paydaş ihtilaflarını çözer, haklarınızı güvence altına alırız.",
    summary: "Mirasçılık, muris muvazaası, tereke ihtilafları",
    highlights: [
      "Mirastan Mal Kaçırma Davaları (Muris Muvazaası)",
      "Tenkis Talebi ve Saklı Pay Davaları",
      "Vasiyetname Hazırlanması",
    ],
    features: [
      "Mirastan Mal Kaçırma Davaları (Muris Muvazaası)",
      "Tenkis Talebi ve Saklı Pay Davaları",
      "Terekeye İade Davaları",
      "Vasiyetname Hazırlanması",
      "Mirastan Feragat Sözleşmeleri",
      "İstihkak Davaları",
      "Terekenin Tespiti Davaları",
      "Mirasın Reddi",
      "Ölünce Kadar Bakma Sözleşmeleri",
      "Mirasçılık Belgesi İstemi",
      "İntikal",
    ],
    relatedCategorySlugs: ["miras-hukuku"],
  },
  {
    id: "gayrimenkul-hukuku",
    title: "Gayrimenkul Hukuku",
    icon: "building",
    description:
      "Taşınmaz mülkiyetinde haklarınızı korur, tapu iptali ve tescil süreçlerini yürütürüz.",
    summary: "Tapu iptali/tescili, ortaklıkların giderilmesi, önalım (şufa) davaları",
    highlights: [
      "Tapu İptal ve Tescil Davaları",
      "Ortaklığın Giderilmesi Davaları",
      "Önalım (Şufa) Davaları",
    ],
    features: [
      "Tapu İptal ve Tescil Davaları",
      "Ön Ödemeli Konut Satış Sözleşmeleri",
      "Taşınmaz Satış Vaadi Sözleşmeleri",
      "Vekaletin Kötüye Kullanılması Davaları",
      "Ortaklığın Giderilmesi Davaları",
      "Önalım (Şufa) Davaları",
      "İnançlı İşlem Davaları",
      "Tapu Sicilinin Düzeltilmesi Davaları",
      "Ecrimisil (Haksız İşgal) Tazminatı Davası",
      "Taşkın Yapı / Olağan-Olağanüstü Zamanaşımı ile Taşınmaz Mülkiyetinin Kazanılması",
      "Elbirliğiyle Mülkiyetin Paylı Mülkiyete Çevrilmesi",
      "İntifa Hakları",
    ],
    relatedCategorySlugs: ["gayrimenkul-hukuku"],
  },
  {
    id: "kira-hukuku",
    title: "Kira Hukuku",
    icon: "key",
    description:
      "Kira ilişkilerinde hak ve yükümlülüklerinizi korur, uyuşmazlıklarda hukuki destek sağlar ve süreçleri yönetiriz.",
    summary: "Kira tahliyesi, sözleşme uyarlama, depozito uyuşmazlıkları",
    highlights: [
      "Kiracının Tahliyesi",
      "Kira Bedelinin Tespiti Davaları",
      "Kira Sözleşmesinin Uyarlanması Davaları",
    ],
    features: [
      "Kiracının Tahliyesi (İhtiyaç, yeniden inşa ve imar, yeni malik vs.)",
      "Kira Bedelinin Tespiti Davaları",
      "Kiralayanın Devri ve Alt Kira İlişkileri Davaları",
      "Kira Sözleşmesinin Sona Ermesi ve Uzaması Davaları",
      "Kira Sözleşmesinin Uyarlanması Davaları (TBK m. 138, olağanüstü hal / değişen koşullar)",
      "Depozito ve Güvence Bedeli Uyuşmazlıkları",
      "Kiralayanın Ayıplı Olması ve Sorumluluk Davaları",
      "Kira Şerhi ve Tescil İşlemleri",
      "Stopaj ve Vergi Kaynaklı Sorunlar",
    ],
    relatedCategorySlugs: ["kira-hukuku"],
  },
  {
    id: "insaat-hukuku",
    title: "İnşaat Hukuku",
    icon: "hammer",
    description:
      "Projelerinizde hukuki süreçleri yönetir, sözleşmeler ve uyuşmazlıklarda çözüm üretiriz.",
    summary: "Kat karşılığı inşaat, eser sözleşmeleri, kentsel dönüşüm süreçleri",
    highlights: [
      "Arsa Payı Karşılığı İnşaat Sözleşmeleri",
      "Ayıplı ve Eksik İş / Gecikme Tazminatı Davaları",
      "Kentsel Dönüşüm Davaları",
    ],
    features: [
      "Arsa Payı Karşılığı İnşaat Sözleşmeleri",
      "Eser Sözleşmeleri",
      "Ayıplı ve Eksik İş / Gecikme Tazminatı Davaları",
      "Arsa Sahibinin Temerrüdü Davaları",
      "Yüklenicinin Temerrüdü Davaları",
      "Yapının İmar Kanununa Aykırı Olması",
      "Sözleşmenin Feshi ve Erken Fesih Hakkı",
      "Eser Sözleşmesinin Yeni Koşullara Uyarlanması",
      "Arsa Sahibinin Dikey ve Yatay Büyümeden Kaynaklı Hakları",
      "Bağımsız Bölüm Satın Alan 3. Kişilerin Hakları",
      "Riskli Yapı Tespiti ve Yıkım Kararı",
      "Kentsel Dönüşüm Davaları",
      "Kentsel Dönüşüm Sürecinde İnşaat Sözleşmeleri",
    ],
    relatedCategorySlugs: ["insaat-hukuku"],
  },
  {
    id: "kamulastirma-ve-imar-hukuku",
    title: "Kamulaştırma ve İmar Hukuku",
    icon: "land",
    description:
      "Kamulaştırma ve imar süreçlerinde haklarınızı korur, hukuki strateji ve çözüm odaklı takip yürütürüz.",
    summary: "Kamulaştırma, kamulaştırmasız el atma, imar ve kadastro davaları",
    highlights: [
      "Kamulaştırmasız El Atma Davaları",
      "Acele Kamulaştırma Davaları",
      "İmar Uygulamasının İptali Davaları",
    ],
    features: [
      "Kamulaştırma Davaları",
      "Acele Kamulaştırma Davaları",
      "Kamulaştırmasız El Atma Davaları (Hukuki El Atma ve Fiili El Atma)",
      "İmar Uygulaması Davaları",
      "Kadastro Davaları",
      "İmar Uygulamasının İptali Davaları",
      "22-A Kadastro Yenileme Uygulaması ve Uygulamadan Kaynaklanan Davalar",
    ],
    relatedCategorySlugs: ["kamulastirmasiz-el-atma"],
  },
];

/** Eski sitede faaliyet alanları bölümünün tanıtım metni. */
export const PRACTICE_AREAS_INTRO =
  "Gayrimenkul Hukuku ve Miras Hukuku alanlarında karşılaştığınız her türlü hukuki soruna çözüm üretiyor, sürecin her türlü aşamasında yanınızda oluyoruz.";
