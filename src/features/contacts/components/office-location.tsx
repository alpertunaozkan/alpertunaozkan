import Image from "next/image";
import { ArrowUpRight, Clock, MapPin, Navigation, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CONTACT } from "@/constants/site";
import { cn } from "@/lib/utils";

interface OfficeLocationProps {
  image: { src: string; alt: string };
  title?: string;
  className?: string;
}

/**
 * Ofis konum kartı. Harici harita gömülmez (sayfa yüklenirken üçüncü taraf
 * isteği oluşmaz); ziyaretçi Google Haritalar'a bağlantıyla yönlendirilir.
 */
export function OfficeLocation({ image, title = "Kırıkkale Ofisi", className }: OfficeLocationProps) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-2xl border border-navy-900/[0.08] bg-white shadow-card lg:grid-cols-2",
        className,
      )}
    >
      <div className="relative min-h-72 bg-navy-100 lg:min-h-full">
        <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" quality={72} className="object-cover" />
      </div>
      <div className="p-7 sm:p-10">
        <h2 className="font-serif text-2xl font-semibold text-navy-950 sm:text-3xl">{title}</h2>
        <dl className="mt-8 grid gap-6 text-[15px]">
          {/* dt/dd grupları doğrudan <div> içindedir (geçerli <dl> yapısı); simge dt içinde konumlanır. */}
          <div className="relative pl-9">
            <dt className="font-semibold text-navy-950">
              <MapPin className="absolute top-0.5 left-0 size-5 text-gold-600" aria-hidden="true" />
              Adres
            </dt>
            <dd className="mt-1 text-slate-600">
              <address className="not-italic">
                {CONTACT.address.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </dd>
          </div>
          <div className="relative pl-9">
            <dt className="font-semibold text-navy-950">
              <Phone className="absolute top-0.5 left-0 size-5 text-gold-600" aria-hidden="true" />
              Telefon
            </dt>
            <dd className="mt-1">
              <a href={CONTACT.phone.href} className="text-navy-800 hover:underline">
                {CONTACT.phone.display}
              </a>
            </dd>
          </div>
          <div className="relative pl-9">
            <dt className="font-semibold text-navy-950">
              <Clock className="absolute top-0.5 left-0 size-5 text-gold-600" aria-hidden="true" />
              Çalışma Saatleri
            </dt>
            <dd className="mt-1 text-slate-600">
              {CONTACT.workingHours.display}
              <span className="block text-sm text-slate-500">{CONTACT.workingHours.weekend}</span>
            </dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={CONTACT.maps.directions} target="_blank" rel="noopener noreferrer">
            <Navigation aria-hidden="true" />
            Yol Tarifi Al
          </ButtonLink>
          <ButtonLink href={CONTACT.maps.place} target="_blank" rel="noopener noreferrer" variant="outline">
            Google Haritalar’da Aç
            <ArrowUpRight aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
