/** ISO 8601 tarih metni (örn. "2026-09-22T18:38:49.906Z"). */
export type ISODateString = string;

/** Uygulama genelinde kullanılan görsel referansı. */
export interface ImageAsset {
  /** Cloudinary (makale görselleri), YouTube (video kapakları) veya yerel (/images/...) adres. */
  url: string;
  /** Erişilebilirlik ve SEO için zorunlu alternatif metin. */
  alt: string;
  /**
   * Görselin gerçek boyutları (px). Görseller yatay, dikey veya kare olabilir;
   * site oranı bu değerlerden okuyup görseli kırpmadan yerleştirir. Medya
   * servisi yükleme sonrası döndürmelidir; bilinmiyorsa görsel güvenli
   * biçimde (tamamı görünecek şekilde) gösterilir.
   */
  width?: number;
  height?: number;
  /** Cloudinary'deki kimlik (public_id); yönetim ve silme için. YouTube kapaklarında yok. */
  publicId?: string;
}

/** Listeleme ekranlarında kullanılan basit seçenek tipi. */
export interface Option<TValue extends string = string> {
  value: TValue;
  label: string;
}
