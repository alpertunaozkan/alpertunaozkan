import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";

/*
 * Yönetici şifresinin özeti (scrypt; Node.js'in yerleşik, bellek-yoğun
 * algoritması). Şifrenin kendisi hiçbir yerde saklanmaz; .env içinde yalnızca
 * özet bulunur. Özet `pnpm admin:hash-password` ile üretilir.
 *
 * Not: Bu dosya "server-only" içe aktarmaz; böylece şifre üretme betiği
 * (scripts/hash-password.ts) de kullanabilir. İstemci kodundan içe
 * aktarılmamalıdır (node:crypto kullanır).
 */

const PARAMS = { N: 2 ** 15, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
// 128 · N · r = 32 MiB; Node.js'in varsayılan üst sınırı tam bu değerde olduğu için genişletilir.
const MAX_MEMORY = 64 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, length: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password.normalize("NFKC"), salt, length, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/**
 * Biçim: "scrypt:N:r:p:tuz:özet" (base64url). Ayırıcı olarak "$" kullanılmaz:
 * Next.js .env dosyalarında "$" ile başlayan ifadeleri değişken sayar.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH, { ...PARAMS, maxmem: MAX_MEMORY });
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join(":");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltText, keyText, ...rest] = stored.split(":");
  if (scheme !== "scrypt" || !saltText || !keyText || rest.length > 0) return false;

  const [N, R, P] = [Number(n), Number(r), Number(p)];
  // Bozuk veya aşırı maliyetli parametrelerle sunucuyu yormayı engeller.
  const sane = Number.isInteger(N) && N >= 2 ** 14 && N <= 2 ** 20 && (N & (N - 1)) === 0 && R >= 1 && R <= 32 && P >= 1 && P <= 16;
  if (!sane) return false;

  const expected = Buffer.from(keyText, "base64url");
  if (expected.length < 32) return false;
  const actual = await scrypt(password, Buffer.from(saltText, "base64url"), expected.length, {
    N,
    r: R,
    p: P,
    maxmem: Math.max(MAX_MEMORY, 256 * N * R),
  });
  return timingSafeEqual(actual, expected);
}
