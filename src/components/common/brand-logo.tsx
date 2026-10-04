import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  /** Koyu zemin (header/footer) için açık renk yazı. */
  inverted?: boolean;
  href?: string;
  size?: "sm" | "md";
  onClick?: () => void;
}

/** Altın sütun logosu + "AV. ALPER TUNA ÖZKAN / HUKUK & DANIŞMANLIK" yazısı. */
export function BrandLogo({ className, inverted = true, href = "/", size = "md", onClick }: BrandLogoProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("group inline-flex min-w-0 items-center gap-3 rounded-md", className)}
    >
      <span className={cn("relative shrink-0", size === "md" ? "h-10 w-7" : "h-8 w-5")}>
        <Image src="/images/brand/logo.svg" alt="" fill sizes="28px" className="object-contain" unoptimized />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "truncate font-serif font-semibold tracking-wide uppercase",
            size === "md" ? "text-[17px] sm:text-lg" : "text-base",
            inverted ? "text-white" : "text-navy-950",
          )}
        >
          Av. Alper Tuna Özkan
        </span>
        <span
          className={cn(
            "mt-1.5 truncate text-[10px] font-medium tracking-[0.32em] uppercase sm:text-[11px]",
            inverted ? "text-gold-300" : "text-gold-700",
          )}
        >
          Hukuk &amp; Danışmanlık
        </span>
      </span>
      {/* Erişilebilir ad görünen metinle başlar (WCAG 2.5.3), bağlantının amacı eklenir. */}
      <span className="sr-only"> — Ana sayfa</span>
    </Link>
  );
}
