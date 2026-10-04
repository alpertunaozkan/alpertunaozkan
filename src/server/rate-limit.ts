import "server-only";

import { headers } from "next/headers";
import { getCollections } from "./db";

/*
 * Basit, veritabanı tabanlı istek sınırlayıcı (sabit pencere). Birden çok
 * sunucu örneğinde de doğru çalışır; süresi dolan sayaçları MongoDB kendisi
 * siler (TTL indeksi).
 */

export interface RateLimitWindow {
  limit: number;
  windowMs: number;
}

export interface RateLimitState {
  count: number;
  limited: boolean;
  retryAfterSeconds: number;
}

/**
 * İstemcinin IP adresi. Ters vekil (nginx vb.) "X-Real-IP" başlığını
 * ayarlamalıdır; yoksa "X-Forwarded-For"daki ilk adres kullanılır.
 */
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-real-ip")?.trim() ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "bilinmiyor"
  );
}

function stateOf(count: number, expiresAt: Date, { limit }: RateLimitWindow): RateLimitState {
  return {
    count,
    limited: count >= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)),
  };
}

/** Sayacı artırmadan mevcut durumu döndürür. */
export async function peekRateLimit(key: string, window: RateLimitWindow): Promise<RateLimitState> {
  const { rateLimits } = await getCollections();
  const doc = await rateLimits.findOne({ _id: key, expiresAt: { $gt: new Date() } });
  return doc ? stateOf(doc.count, doc.expiresAt, window) : { count: 0, limited: false, retryAfterSeconds: 0 };
}

/** Sayacı bir artırır; pencere dolmuşsa yeniden başlatır. */
export async function hitRateLimit(key: string, window: RateLimitWindow): Promise<RateLimitState> {
  const { rateLimits } = await getCollections();
  const now = new Date();
  await rateLimits.deleteOne({ _id: key, expiresAt: { $lte: now } });
  const doc = await rateLimits.findOneAndUpdate(
    { _id: key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(now.getTime() + window.windowMs) } },
    { upsert: true, returnDocument: "after" },
  );
  return doc ? stateOf(doc.count, doc.expiresAt, window) : { count: 1, limited: false, retryAfterSeconds: 0 };
}

export async function clearRateLimit(key: string): Promise<void> {
  const { rateLimits } = await getCollections();
  await rateLimits.deleteOne({ _id: key });
}
