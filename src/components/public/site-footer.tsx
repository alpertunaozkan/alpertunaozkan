import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { Container } from "@/components/common/container";
import { SocialIcon } from "@/components/common/social-icon";
import {
  CONTACT,
  DEVELOPER_CREDIT,
  LOCATION_PAGE,
  MAIN_NAV,
  SITE,
  SOCIAL_LINKS,
} from "@/constants/site";
import { practiceAreas } from "@/data/practice-areas";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 pb-24 text-white/70 xl:pb-0" data-menu-inert>
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <BrandLogo />
          <p className="mt-6 max-w-sm text-sm leading-relaxed">{SITE.manifestDescription}</p>
          <ul className="mt-6 flex gap-3" aria-label="Sosyal medya">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.platform}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition-colors hover:border-gold-400 hover:text-gold-300"
                >
                  <SocialIcon platform={social.platform} className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <FooterColumn title="Sayfalar" className="lg:col-span-2">
          {MAIN_NAV.map((item) => (
            <li key={item.href}>
              <FooterLink href={item.href}>{item.label}</FooterLink>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Faaliyet Alanları" className="lg:col-span-3">
          {practiceAreas.map((area) => (
            <li key={area.id}>
              <FooterLink href={`/faaliyet-alanlarim#${area.id}`}>{area.title}</FooterLink>
            </li>
          ))}
          <li>
            <FooterLink href={LOCATION_PAGE.href}>{LOCATION_PAGE.label}</FooterLink>
          </li>
        </FooterColumn>

        <div className="lg:col-span-3">
          <h2 className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">İletişim</h2>
          <address className="mt-5 grid gap-4 text-sm not-italic">
            <a
              href={CONTACT.maps.place}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 transition-colors hover:text-white"
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden="true" />
              <span>
                {CONTACT.address.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </a>
            <a href={CONTACT.phone.href} className="flex gap-3 transition-colors hover:text-white">
              <Phone className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden="true" />
              {CONTACT.phone.display}
            </a>
            <a href={`mailto:${CONTACT.email}`} className="flex gap-3 break-all transition-colors hover:text-white">
              <Mail className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden="true" />
              {CONTACT.email}
            </a>
            <p className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden="true" />
              {CONTACT.workingHours.display}
            </p>
          </address>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs leading-relaxed sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.personName}. Tüm hakları saklıdır.
            <span className="mt-1 block text-white/55 sm:mt-0 sm:ml-2 sm:inline">
              Sitedeki içerikler genel bilgilendirme amaçlıdır; hukuki danışmanlık yerine geçmez.
            </span>
          </p>
          <a
            href={DEVELOPER_CREDIT.href}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-white/55 transition-colors hover:text-white"
          >
            {DEVELOPER_CREDIT.label}
          </a>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <h2 className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">{title}</h2>
      <ul className="mt-5 grid gap-3 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="transition-colors hover:text-white">
      {children}
    </Link>
  );
}
