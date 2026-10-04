/*
 * Yönetici şifresini belirler: pnpm admin:hash-password
 *
 * Şifre ekrana yazılmadan iki kez sorulur; özeti (ADMIN_PASSWORD_HASH)
 * .env.local dosyasına yazılır (dosya yoksa oluşturulur, diğer satırlara
 * dokunulmaz). Şifrenin kendisi hiçbir yere kaydedilmez.
 *
 *   pnpm admin:hash-password           → .env.local dosyasını günceller
 *   pnpm admin:hash-password --print   → yalnızca satırı yazdırır (sunucu ortamına eklemek için)
 *
 * Etkileşimsiz kullanım (ör. şifre yöneticisinden): şifre standart girdiden
 * okunur → `pbpaste | pnpm --silent admin:hash-password --print`
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { hashPassword, verifyPassword } from "../src/server/auth/password";

const ENV_FILE = ".env.local";
const MIN_LENGTH = 12;
/** Giriş formunun kabul ettiği üst sınır (src/features/auth/login.ts). */
const MAX_LENGTH = 200;

/** Yazılanı ekrana yansıtmadan soruları sırayla sorar. */
function askHidden(questions: string[]): Promise<string[]> {
  const silent = new Writable({ write: (_chunk, _encoding, callback) => callback() });
  const rl = createInterface({ input: process.stdin, output: silent, terminal: true });
  rl.on("SIGINT", () => {
    rl.close();
    process.stdout.write("\nİptal edildi.\n");
    process.exit(130);
  });

  return new Promise((resolve) => {
    const answers: string[] = [];
    const next = () => {
      const question = questions[answers.length];
      if (question === undefined) {
        rl.close();
        resolve(answers);
        return;
      }
      process.stdout.write(question);
      rl.question("", (answer) => {
        process.stdout.write("\n");
        answers.push(answer);
        next();
      });
    };
    next();
  });
}

async function readFirstLine(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks).toString("utf8").split(/\r?\n/, 1)[0] ?? "";
}

function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

/** Ortam dosyasındaki tek bir değişkeni ekler veya değiştirir; diğer satırlar korunur. */
function writeEnvValue(file: string, key: string, value: string) {
  const original = existsSync(file) ? readFileSync(file, "utf8") : "";
  const entry = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const separator = original && !original.endsWith("\n") ? "\n" : "";
  const next = pattern.test(original) ? original.replace(pattern, () => entry) : `${original}${separator}${entry}\n`;
  // Yeni oluşturulan dosyayı yalnızca sahibi okuyabilir.
  writeFileSync(file, next, { mode: 0o600 });
}

async function main() {
  const printOnly = process.argv.includes("--print");
  const unknown = process.argv.slice(2).filter((option) => option !== "--print");
  if (unknown.length > 0) fail(`Bilinmeyen seçenek: ${unknown.join(" ")} (yalnızca --print desteklenir).`);

  let password: string;
  if (process.stdin.isTTY) {
    console.log("Yönetici şifresi (yazdıklarınız ekranda görünmez).");
    const [first, second] = await askHidden(["Şifre: ", "Şifre (tekrar): "]);
    if (first !== second) fail("Şifreler eşleşmiyor.");
    password = first ?? "";
  } else {
    password = await readFirstLine();
  }

  if (password.trim() !== password) fail("Şifre boşlukla başlayamaz veya bitemez.");
  if ([...password].length < MIN_LENGTH) fail(`Şifre en az ${MIN_LENGTH} karakter olmalıdır.`);
  if (password.length > MAX_LENGTH) fail(`Şifre en fazla ${MAX_LENGTH} karakter olabilir.`);

  const hash = await hashPassword(password);
  if (!(await verifyPassword(password, hash))) fail("Özet doğrulanamadı; lütfen tekrar deneyin.");

  if (printOnly) {
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    return;
  }
  writeEnvValue(ENV_FILE, "ADMIN_PASSWORD_HASH", hash);
  console.log(`\n✓ Şifre özeti ${ENV_FILE} dosyasına yazıldı (ADMIN_PASSWORD_HASH).`);
  console.log("  Geliştirme sunucusu değişikliği kendisi algılar; derlenmiş sunucuyu yeniden başlatın.");
  console.log("  Yeni şifre geçerli olduğunda açık oturumlar kendiliğinden kapanır.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
