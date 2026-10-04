import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  white: "bg-white",
  cream: "bg-cream-100",
  navy: "bg-navy-950 text-white",
} as const;

interface SectionProps extends ComponentProps<"section"> {
  tone?: keyof typeof tones;
}

export function Section({ className, tone = "white", ...props }: SectionProps) {
  return <section className={cn("py-16 sm:py-20 lg:py-24", tones[tone], className)} {...props} />;
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  /** Koyu zemin üzerinde kullanım. */
  inverted?: boolean;
  as?: "h1" | "h2";
  id?: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverted = false,
  as: Heading = "h2",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow inverted={inverted} centered={align === "center"}>{eyebrow}</Eyebrow> : null}
      <Heading
        id={id}
        className={cn(
          "font-serif text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl",
          inverted ? "text-white" : "text-navy-950",
          eyebrow && "mt-4",
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-pretty sm:text-lg",
            inverted ? "text-white/70" : "text-slate-600",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Eyebrow({
  children,
  inverted = false,
  centered = false,
  className,
}: {
  children: ReactNode;
  inverted?: boolean;
  centered?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-xs font-semibold tracking-[0.18em] uppercase",
        inverted ? "text-gold-300" : "text-gold-700",
        centered && "justify-center",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("h-px w-8", inverted ? "bg-gold-400/70" : "bg-gold-500")} />
      {children}
    </p>
  );
}
