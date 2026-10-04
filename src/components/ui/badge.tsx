import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "border-navy-900/10 bg-navy-50 text-navy-800",
        gold: "border-gold-300/70 bg-gold-50 text-gold-800",
        navy: "border-navy-900 bg-navy-900 text-white",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800",
        warning: "border-amber-200 bg-amber-50 text-amber-900",
        danger: "border-red-200 bg-red-50 text-red-700",
        outline: "border-navy-900/15 bg-white text-slate-700",
        glass: "border-white/25 bg-white/10 text-white backdrop-blur-sm",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
