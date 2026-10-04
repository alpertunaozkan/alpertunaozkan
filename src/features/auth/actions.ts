"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyPassword } from "@/server/auth/password";
import { createSession, deleteSession } from "@/server/auth/session";
import { getAuthEnv } from "@/server/env";
import { clearRateLimit, getClientIp, hitRateLimit, peekRateLimit } from "@/server/rate-limit";
import { loginSchema, safeAdminPath, type LoginState } from "./login";

/*
 * Tek hesaplı yönetici girişi. Hesap avukata aittir; kullanıcı adı ve şifre
 * özeti ortam değişkenlerindedir (ADMIN_USERNAME, ADMIN_PASSWORD_HASH).
 * Kayıt olma ve şifre sıfırlama yoktur.
 */

/** Aynı IP'den 15 dakikada en fazla 5 hatalı deneme. */
const LOGIN_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
const INVALID_CREDENTIALS = "Kullanıcı adı veya şifre hatalı.";

/** Sabit süreli karşılaştırma (uzunluk farkı da sızdırılmaz). */
function sameText(a: string, b: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value.normalize("NFKC")).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export async function login(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const parsed = loginSchema.safeParse({ username, password: String(formData.get("password") ?? "") });

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      status: "error",
      message: "Lütfen kullanıcı adı ve şifrenizi girin.",
      username,
      fieldErrors: { username: fieldErrors.username?.[0], password: fieldErrors.password?.[0] },
    };
  }

  const rateKey = `login:${await getClientIp()}`;
  const before = await peekRateLimit(rateKey, LOGIN_LIMIT);
  if (before.limited) {
    const minutes = Math.ceil(before.retryAfterSeconds / 60);
    return {
      status: "error",
      message: `Çok fazla hatalı deneme yapıldı. Lütfen ${minutes} dakika sonra tekrar deneyin.`,
      username,
      fieldErrors: {},
    };
  }

  const { ADMIN_USERNAME, ADMIN_PASSWORD_HASH } = getAuthEnv();
  // Kullanıcı adı yanlış olsa da şifre kontrolü yapılır; yanıt süresinden bilgi sızmaz.
  const passwordOk = await verifyPassword(parsed.data.password, ADMIN_PASSWORD_HASH);
  const usernameOk = sameText(parsed.data.username, ADMIN_USERNAME);

  if (!passwordOk || !usernameOk) {
    const after = await hitRateLimit(rateKey, LOGIN_LIMIT);
    const remaining = LOGIN_LIMIT.limit - after.count;
    return {
      status: "error",
      message:
        remaining > 0 && remaining <= 2
          ? `${INVALID_CREDENTIALS} ${remaining} deneme hakkınız kaldı.`
          : after.limited
            ? `${INVALID_CREDENTIALS} Çok fazla hatalı deneme yapıldı; lütfen ${Math.ceil(after.retryAfterSeconds / 60)} dakika sonra tekrar deneyin.`
            : INVALID_CREDENTIALS,
      username,
      fieldErrors: {},
    };
  }

  await clearRateLimit(rateKey);
  await createSession();
  redirect(safeAdminPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/admin/login");
}
