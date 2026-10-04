import type { ReactNode } from "react";
import { Container } from "@/components/common/container";
import { Eyebrow } from "@/components/common/section";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";

interface PageHeroProps {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  breadcrumbs: BreadcrumbItem[];
  children?: ReactNode;
}

/** İç sayfaların başlık alanı (eski sitedeki krem PageHeader'ın sadeleştirilmiş hâli). */
export function PageHero({ title, description, eyebrow, breadcrumbs, children }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-navy-900/[0.06] bg-cream-100">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 -z-10 hidden w-1/3 bg-[linear-gradient(90deg,transparent,rgb(184_141_42/0.07))] lg:block"
      />
      <div aria-hidden="true" className="absolute top-0 left-0 h-full w-1 bg-gold-500/80" />
      <Container className="py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-8 max-w-3xl">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className="mt-4 font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-navy-950 sm:text-5xl lg:text-[3.5rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-slate-600">{description}</p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}
