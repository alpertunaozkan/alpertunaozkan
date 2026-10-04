const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
  â: "a",
  Â: "a",
  î: "i",
  Î: "i",
  û: "u",
  Û: "u",
};

/**
 * Türkçe karakterleri dönüştürerek URL uyumlu slug üretir.
 * "Geçit Hakkı Davası Nedir?" → "gecit-hakki-davasi-nedir"
 * (Eski API'deki slugifyTR ile aynı kurallar.)
 */
export function slugify(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[çÇğĞıIİöÖşŞüÜâÂîÎûÛ]/g, (char) => TURKISH_CHAR_MAP[char] ?? char)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Mevcut slug'larla çakışmayan benzersiz bir slug döndürür. */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = slugify(base) || "icerik";
  if (!used.has(root)) return root;
  let index = 2;
  while (used.has(`${root}-${index}`)) index += 1;
  return `${root}-${index}`;
}
