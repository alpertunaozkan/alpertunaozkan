import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getSession, type AdminSession } from "./auth/session";

/*
 * Veri erişim katmanının yetki kontrolü. Panel verisini okuyan her sorgu ve
 * veriyi değiştiren her sunucu işlemi bunu çağırır; proxy yalnızca hızlı bir
 * ön kontroldür (çerez var mı), asıl doğrulama buradadır.
 */
export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
});
