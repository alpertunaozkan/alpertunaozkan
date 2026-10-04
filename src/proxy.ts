import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/server/auth/cookie";

/*
 * Panel için hızlı ön kontrol: oturum çerezi yoksa giriş sayfasına
 * yönlendirir. Oturumun geçerliliği (veritabanı) burada değil, veri erişim
 * katmanında (src/server/dal.ts) her sorgu ve işlemde ayrıca doğrulanır.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login" || request.cookies.has(ADMIN_SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  if (pathname !== "/admin" && pathname !== "/admin/dashboard") {
    loginUrl.searchParams.set("next", `${pathname}${search}`);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
