import Link from "next/link";
import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-navy-900 text-white shadow-sm hover:bg-navy-800",
        gold: "bg-gold-400 text-navy-950 shadow-sm hover:bg-gold-300",
        outline:
          "border border-navy-900/15 bg-white text-navy-900 hover:border-navy-900/30 hover:bg-cream-100",
        "outline-light":
          "border border-white/30 text-white hover:border-white/60 hover:bg-white/10",
        ghost: "text-navy-800 hover:bg-navy-900/5",
        danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        "danger-ghost": "text-red-700 hover:bg-red-50",
        link: "text-navy-800 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px] [&_svg]:size-4",
        md: "h-11 px-5 text-sm [&_svg]:size-4",
        lg: "h-12 px-7 text-[15px] [&_svg]:size-[18px]",
        icon: "size-10 [&_svg]:size-[18px]",
        "icon-sm": "size-8 rounded-md [&_svg]:size-4",
        inline: "h-auto p-0 text-sm [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps extends ComponentProps<"button">, ButtonVariantProps {}

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export interface ButtonLinkProps extends ComponentProps<typeof Link>, ButtonVariantProps {}

/** Buton görünümlü bağlantı (iç sayfa, tel:, mailto: veya harici URL). */
export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
