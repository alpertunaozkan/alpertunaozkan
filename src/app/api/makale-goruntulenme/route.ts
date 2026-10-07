import type { NextRequest } from "next/server";
import { SITE } from "@/constants/site";
import { ADMIN_SESSION_COOKIE } from "@/server/auth/cookie";
import { getCollections } from "@/server/db";
import { parseObjectId } from "@/server/mappers";
import { getClientIp } from "@/server/rate-limit";

/*
 * Makale görüntülenme sayacı. Makale sayfası tarayıcıda açılınca istemci bu
 * adrese makalenin kimliğini gönderir (bkz. ArticleViewTracker); yayındaki
 * makalenin görüntülenme sayısı bir artar. Sayı yalnızca panelde gösterilir.
 *
 * Sayılmayanlar: sitenin kendi adresinden gelmeyen istekler (başka siteler,
 * yerel geliştirme), botlar, panelde oturumu açık yönetici ve aynı IP'den kısa
 * sürede gelen fazla istekler. Çerez kullanılmaz; IP adresi veritabanına
 * yazılmaz, yalnızca bu sınır için sunucu belleğinde en çok bir saat tutulur.
 */

const SITE_ORIGIN = new URL(SITE.url).origin;

/** JavaScript çalıştıran tarayıcı/ölçüm botları (arama motorları, Lighthouse, otomasyon). */
const BOT_USER_AGENT = /bot|crawl|spider|slurp|preview|lighthouse|headless|inspectiontool|googleother/i;

/** Aynı IP'den saatte en fazla bu kadar görüntülenme sayılır (tek sunucu süreci için bellek içi). */
const PER_IP_LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_TRACKED_IPS = 10_000;
const recentByIp = new Map<string, { count: number; resetAt: number }>();

function withinLimit(ip: string): boolean {
  const now = Date.now();
  if (recentByIp.size >= MAX_TRACKED_IPS) {
    for (const [key, entry] of recentByIp) if (entry.resetAt <= now) recentByIp.delete(key);
    if (recentByIp.size >= MAX_TRACKED_IPS) recentByIp.clear();
  }

  const entry = recentByIp.get(ip);
  if (!entry || entry.resetAt <= now) {
    recentByIp.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= PER_IP_LIMIT;
}

function noContent() {
  return new Response(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent");
  if (request.headers.get("origin") !== SITE_ORIGIN || !userAgent || BOT_USER_AGENT.test(userAgent)) {
    return noContent();
  }
  if (request.cookies.has(ADMIN_SESSION_COOKIE)) return noContent();

  const articleId = parseObjectId((await request.text()).trim());
  if (!articleId) return new Response(null, { status: 400 });
  if (!withinLimit(await getClientIp())) return noContent();

  try {
    const { articles } = await getCollections();
    await articles.updateOne({ _id: articleId, status: "published" }, { $inc: { viewCount: 1 } });
  } catch (error) {
    console.error("[makale görüntülenme]", error);
  }
  return noContent();
}
