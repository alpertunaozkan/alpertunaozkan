"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-cream-100 px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl font-semibold text-navy-950">Bir hata oluştu</h1>
        <p className="mt-3 text-slate-600">Lütfen tekrar deneyin veya daha sonra kontrol edin.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => retry()}>
            <RotateCcw aria-hidden="true" />
            Yeniden Dene
          </Button>
          <ButtonLink href="/" variant="outline">
            Ana sayfa
          </ButtonLink>
        </div>
        {error.digest ? <p className="mt-4 text-xs text-slate-500">Hata kodu: {error.digest}</p> : null}
      </div>
    </main>
  );
}
