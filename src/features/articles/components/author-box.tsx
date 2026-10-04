import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function AuthorBox() {
  return (
    <aside
      aria-label="Yazar"
      className="flex flex-col gap-5 rounded-2xl border border-navy-900/[0.08] bg-cream-50 p-6 sm:flex-row sm:items-center sm:p-8"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-navy-100 ring-2 ring-gold-400/60">
        <Image
          src="/images/profile/alper-tuna-ozkan-portre.webp"
          alt="Av. Alper Tuna Özkan"
          fill
          sizes="80px"
          className="object-cover object-top"
        />
      </div>
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-gold-700 uppercase">Yazar</p>
        <p className="mt-1 font-serif text-xl font-semibold text-navy-950">Av. Alper Tuna Özkan</p>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
          Kırıkkale’de gayrimenkul ve miras hukuku alanlarında danışmanlık ve dava takibi yürütmektedir.
        </p>
        <Link
          href="/hakkimda"
          className="group mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-navy-600"
        >
          Hakkımda
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
