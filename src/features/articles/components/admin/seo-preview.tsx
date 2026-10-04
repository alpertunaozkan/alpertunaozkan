import { SITE } from "@/constants/site";
import { truncate } from "@/lib/text";

const TITLE_SUFFIX = " | Kırıkkale Gayrimenkul Avukatı Alper Tuna Özkan";

/** Makalenin arama sonuçlarındaki görünümüne yaklaşık önizleme. */
export function SeoPreview({ title, slug, summary }: { title: string; slug: string; summary: string }) {
  const host = SITE.url.replace(/^https?:\/\//, "");
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="truncate text-xs text-slate-600">
        {host} › makalelerim › {slug || "makale-adresi"}
      </p>
      <p className="mt-1 line-clamp-2 text-[17px] leading-snug text-[#1a0dab]">
        {truncate(`${title || "Makale başlığı"}${TITLE_SUFFIX}`, 70)}
      </p>
      <p className="mt-1 line-clamp-3 text-sm leading-snug text-[#4d5156]">
        {summary ? truncate(summary, 155) : "Özet yazıldığında burada arama sonucu açıklaması olarak görünür."}
      </p>
    </div>
  );
}
