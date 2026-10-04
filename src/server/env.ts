import "server-only";

import { z } from "zod";

/*
 * Sunucu ortam değişkenleri. Değerler .env dosyalarından veya barındırma
 * ortamından okunur; hiçbiri istemciye gönderilmez. Her grup ilk
 * kullanıldığında doğrulanır; eksik ya da hatalı değer açık bir hatayla
 * durdurulur. Değişkenlerin listesi ve açıklamaları: .env.example
 */

const optional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const databaseSchema = z.object({
  MONGODB_URI: z
    .string({ error: "tanımlı değil" })
    .trim()
    .regex(/^mongodb(\+srv)?:\/\//, "mongodb:// veya mongodb+srv:// ile başlamalı"),
  /** Bağlantı adresinde veritabanı adı yoksa kullanılacak ad. */
  MONGODB_DB: optional,
});

const authSchema = z.object({
  ADMIN_USERNAME: z.string({ error: "tanımlı değil" }).trim().min(3, "en az 3 karakter olmalı"),
  ADMIN_PASSWORD_HASH: z
    .string({ error: "tanımlı değil" })
    .trim()
    .startsWith("scrypt:", "`pnpm admin:hash-password` ile üretilmiş olmalı"),
});

const cloudinarySchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string({ error: "tanımlı değil" }).trim().min(1, "tanımlı değil"),
  CLOUDINARY_API_KEY: z.string({ error: "tanımlı değil" }).trim().min(1, "tanımlı değil"),
  CLOUDINARY_API_SECRET: z.string({ error: "tanımlı değil" }).trim().min(1, "tanımlı değil"),
  /** Makale görsellerinin yüklendiği klasör (eski projeyle aynı: articles). */
  CLOUDINARY_ARTICLE_FOLDER: optional.transform((value) => value ?? "articles"),
  /** İsteğe bağlı imzalı yükleme ön ayarı (Cloudinary → Settings → Upload presets). */
  CLOUDINARY_ARTICLE_UPLOAD_PRESET: optional,
});

export type DatabaseEnv = z.infer<typeof databaseSchema>;
export type AuthEnv = z.infer<typeof authSchema>;
export type CloudinaryEnv = z.infer<typeof cloudinarySchema>;

function parse<T extends z.ZodType>(schema: T, group: string): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (result.success) return result.data;
  const details = result.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; ");
  throw new Error(`[ortam] ${group} ayarları eksik veya hatalı: ${details}. Bkz. .env.example`);
}

let databaseEnv: DatabaseEnv | undefined;
let authEnv: AuthEnv | undefined;
let cloudinaryEnv: CloudinaryEnv | undefined;

export function getDatabaseEnv(): DatabaseEnv {
  databaseEnv ??= parse(databaseSchema, "Veritabanı");
  return databaseEnv;
}

export function getAuthEnv(): AuthEnv {
  authEnv ??= parse(authSchema, "Yönetici girişi");
  return authEnv;
}

export function getCloudinaryEnv(): CloudinaryEnv {
  cloudinaryEnv ??= parse(cloudinarySchema, "Cloudinary");
  return cloudinaryEnv;
}
