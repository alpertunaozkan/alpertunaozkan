/*
 * Yönetici oturum çerezinin adı. Proxy (src/proxy.ts) de kullandığı için bu
 * dosya sunucuya özel modülleri içe aktarmaz.
 *
 * Üretimde "__Host-" öneki kullanılır: tarayıcı bu çerezi yalnızca HTTPS
 * üzerinden, yalnızca bu alan adı için ve path=/ ile kabul eder.
 */
export const ADMIN_SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-admin-session" : "admin-session";
