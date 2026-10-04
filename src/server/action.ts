import "server-only";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";

/** Kullanıcıya gösterilebilir hata (doğrulama, çakışma, bulunamadı). */
export class UserError extends Error {
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "UserError";
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Sunucu işlemini çalıştırır ve sonucu ActionResult olarak döndürür.
 * Next.js'in kontrol akışı (redirect, notFound) aynen iletilir; beklenmeyen
 * hatalar sunucu günlüğüne yazılır, kullanıcıya genel bir metin gider.
 */
export async function runAction<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UserError) return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    // Error olmayan nesneler (bazı kütüphanelerin hataları) gizli bilgi içerebilir; olduğu gibi yazılmaz.
    console.error("[sunucu işlemi]", error instanceof Error ? error : `Beklenmeyen hata türü: ${typeof error}`);
    return { ok: false, error: "İşlem tamamlanamadı. Lütfen biraz sonra tekrar deneyin." };
  }
}

/** Herkese açık sayfaları (ana sayfa, makaleler, videolar, site haritası…) bir sonraki ziyarette yeniler. */
export function revalidatePublicSite(): void {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}
