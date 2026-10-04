import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  /** Son öğe (mevcut sayfa) için href verilmez. */
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Sayfa konumu" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-600">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 ? <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" /> : null}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-navy-900">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={cn("truncate font-medium text-navy-900", "max-w-[60vw] sm:max-w-md")}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** schema.org BreadcrumbList üretir; son öğenin URL'i `currentPath` ile verilir. */
export function breadcrumbJsonLd(items: BreadcrumbItem[], currentPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href ?? currentPath),
    })),
  };
}
