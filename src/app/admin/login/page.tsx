import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeAdminPath } from "@/features/auth/login";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Giriş" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  const target = safeAdminPath(next);
  // Oturum zaten açıksa giriş ekranı gösterilmez.
  if (await getSession()) redirect(target);

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative isolate hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Image
          src="/images/profile/alper-tuna-ozkan-ofis.webp"
          alt=""
          fill
          sizes="50vw"
          quality={65}
          loading="eager"
          className="-z-20 object-cover opacity-30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,oklch(0.2_0.055_264/0.7),var(--color-navy-950)_75%)]"
        />
        <div className="flex items-center gap-3">
          <span className="relative h-10 w-7">
            <Image src="/images/brand/logo.svg" alt="" fill sizes="28px" unoptimized className="object-contain" />
          </span>
          <div className="leading-tight">
            <p className="font-serif text-lg font-semibold">AV. ALPER TUNA ÖZKAN</p>
            <p className="text-[11px] tracking-[0.3em] text-gold-300 uppercase">Hukuk &amp; Danışmanlık</p>
          </div>
        </div>
        <div className="max-w-md">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">Yönetim Paneli</p>
          <p className="mt-4 font-serif text-4xl leading-tight font-semibold">
            Makaleleri, videoları ve iletişim mesajlarını tek yerden yönetin.
          </p>
        </div>
        <p className="text-sm text-white/50">alpertunaozkan.com</p>
      </section>

      <section className="flex items-center justify-center bg-cream-100 px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="relative h-9 w-6">
              <Image src="/images/brand/logo.svg" alt="" fill sizes="24px" unoptimized className="object-contain" />
            </span>
            <p className="font-serif text-lg font-semibold text-navy-950">Av. Alper Tuna Özkan</p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Yönetim Paneline Giriş</h1>
          <p className="mt-1.5 text-sm text-slate-600">Yetkili kullanıcılar için giriş ekranı</p>

          <div className="mt-8 rounded-2xl border border-navy-900/[0.08] bg-white p-6 shadow-card sm:p-7">
            <LoginForm next={target === "/admin/dashboard" ? undefined : target} />
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy-900"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Siteye dön
          </Link>
        </div>
      </section>
    </main>
  );
}
