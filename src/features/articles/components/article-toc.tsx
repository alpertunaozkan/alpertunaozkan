import { ListTree } from "lucide-react";
import type { TocItem } from "@/lib/article-html";
import { cn } from "@/lib/utils";

/** Makale içindekiler listesi (sunucuda üretilen başlık id'lerine bağlanır). */
export function ArticleToc({ items, className }: { items: TocItem[]; className?: string }) {
  if (items.length < 2) return null;

  return (
    <nav aria-label="İçindekiler" className={className}>
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-gold-700 uppercase">
        <ListTree className="size-4" aria-hidden="true" />
        Bu yazıda
      </p>
      <ol className="mt-4 space-y-1 border-l border-navy-900/10">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l border-transparent py-1.5 text-sm leading-snug text-slate-600 transition-colors hover:border-gold-500 hover:text-navy-950",
                item.level === 2 ? "pl-4" : "pl-7 text-[13px]",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
