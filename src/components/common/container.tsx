import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const sizes = {
  /** Site geneli: header ve slider ile aynı yatay boşluk (lg:px-16). */
  default: "max-w-[90rem]",
  /** Okuma odaklı içerikler (makale gövdesi vb.). */
  narrow: "max-w-4xl",
} as const;

interface ContainerProps extends ComponentProps<"div"> {
  size?: keyof typeof sizes;
}

export function Container({ className, size = "default", ...props }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-16", sizes[size], className)} {...props} />
  );
}
