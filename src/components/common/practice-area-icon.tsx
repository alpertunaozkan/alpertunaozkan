import { Building2, Hammer, KeyRound, LandPlot, Scale, type LucideProps } from "lucide-react";
import type { PracticeAreaIcon as PracticeAreaIconName } from "@/data/practice-areas";

const icons = {
  scale: Scale,
  building: Building2,
  key: KeyRound,
  hammer: Hammer,
  land: LandPlot,
} satisfies Record<PracticeAreaIconName, unknown>;

export function PracticeAreaIcon({ name, ...props }: { name: PracticeAreaIconName } & LucideProps) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" strokeWidth={1.75} {...props} />;
}
