import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { Container } from "@/components/common/container";
import { Eyebrow } from "@/components/common/section";
import { ButtonLink } from "@/components/ui/button";
import { CONTACT } from "@/constants/site";

/** Sayfa sonlarındaki iletişim çağrısı (metinler eski ana sayfadan). */
export function ContactCta() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 text-white">
      <Image
        src="/images/profile/alper-tuna-ozkan-banner.webp"
        alt=""
        fill
        sizes="100vw"
        quality={70}
        className="-z-20 object-cover object-[70%_25%] opacity-40"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--color-navy-950)_0%,oklch(0.2_0.055_264/0.92)_45%,oklch(0.2_0.055_264/0.55)_100%)]"
      />
      <Container className="py-20 lg:py-24">
        <div className="max-w-2xl">
          <Eyebrow inverted>Hemen İletişime Geçin</Eyebrow>
          <h2 className="mt-4 font-serif text-3xl leading-tight font-semibold text-balance sm:text-4xl lg:text-5xl">
            Hukuki Danışmanlık İçin Bize Ulaşın
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/75">
            Randevu ve bilgi talebi için bizi arayın veya form üzerinden mesaj bırakın.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={CONTACT.phone.href} variant="gold" size="lg">
              <Phone aria-hidden="true" />
              {CONTACT.phone.display}
            </ButtonLink>
            <ButtonLink href="/iletisim#iletisim-formu" variant="outline-light" size="lg">
              <Mail aria-hidden="true" />
              İletişim Formu
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-white/55">Mesai saatleri: {CONTACT.workingHours.display}</p>
        </div>
      </Container>
    </section>
  );
}
