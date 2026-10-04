import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getCollections } from "../db";
import { getAuthEnv } from "../env";
import { ADMIN_SESSION_COOKIE } from "./cookie";

/*
 * Veritabanı oturumları: çerezde rastgele bir anahtar, veritabanında
 * yalnızca bu anahtarın özeti tutulur. Çıkışta kayıt silindiği için çerez
 * ele geçirilse bile tekrar kullanılamaz; süresi dolan kayıtları MongoDB
 * kendisi siler (TTL indeksi).
 *
 * Her oturum, açıldığı andaki giriş bilgilerine (kullanıcı adı + şifre özeti)
 * bağlıdır: şifre değiştirilip sunucu yeni değerlerle başlatıldığında eski
 * oturumların hepsi kendiliğinden geçersiz olur.
 */

const SESSION_DAYS = 7;
const secure = process.env.NODE_ENV === "production";

export interface AdminSession {
  expiresAt: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Geçerli giriş bilgilerinin parmak izi (bilgilerin kendisi saklanmaz). */
function credentialFingerprint(): string {
  const { ADMIN_USERNAME, ADMIN_PASSWORD_HASH } = getAuthEnv();
  return createHash("sha256").update(`${ADMIN_USERNAME}\0${ADMIN_PASSWORD_HASH}`).digest("hex").slice(0, 32);
}

export async function createSession(): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  const credential = credentialFingerprint();
  const { adminSessions } = await getCollections();
  // Şifre değişmeden önce açılmış (artık geçersiz) oturumlar temizlenir.
  await adminSessions.deleteMany({ credential: { $ne: credential } });
  await adminSessions.insertOne({ _id: new ObjectId(), tokenHash: hashToken(token), credential, createdAt, expiresAt, userAgent });

  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Geçerli oturum (istek başına bir kez sorgulanır). */
export const getSession = cache(async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const { adminSessions } = await getCollections();
  const session = await adminSessions.findOne({
    tokenHash: hashToken(token),
    credential: credentialFingerprint(),
    expiresAt: { $gt: new Date() },
  });
  return session ? { expiresAt: session.expiresAt.toISOString() } : null;
});

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    const { adminSessions } = await getCollections();
    await adminSessions.deleteOne({ tokenHash: hashToken(token) });
  }
  // "__Host-" çerezi yalnızca aynı niteliklerle (secure, path=/) silinebilir.
  store.set(ADMIN_SESSION_COOKIE, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
}
