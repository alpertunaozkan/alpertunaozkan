import { z } from "zod";

/*
 * İletişim formu doğrulaması. Hata metinleri eski projedeki şemadan alındı.
 * Düzeltmeler: ad-soyad sınır mesajı (eski: "50 karakter", sınır 100 idi) ve
 * telefon deseni ("+90 (534) 018 19 33" gibi biçimli numaralar 15 karakteri
 * aştığı için eski desen tarafından reddediliyordu).
 */

const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;
const EMAIL_OR_PHONE_MESSAGE = "Lütfen e-posta adresi veya telefon numarasından en az birini girin";

export const contactFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Lütfen adınızı ve soyadınızı girin")
      .max(100, "Ad soyad en fazla 100 karakter olabilir"),
    email: z.union([z.literal(""), z.email("Lütfen geçerli bir e-posta adresi girin")]),
    phone: z.union([
      z.literal(""),
      z.string().regex(PHONE_PATTERN, "Lütfen geçerli bir telefon numarası girin"),
    ]),
    subject: z
      .string()
      .trim()
      .min(10, "Konunuz en az 10 karakter olmalıdır")
      .max(200, "Konunuz en fazla 200 karakter olabilir"),
    message: z
      .string()
      .trim()
      .min(10, "Mesajınız en az 10 karakter olmalıdır")
      .max(2000, "Mesajınız en fazla 2000 karakter olabilir"),
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone) {
      ctx.addIssue({ code: "custom", message: EMAIL_OR_PHONE_MESSAGE, path: ["email"] });
      ctx.addIssue({ code: "custom", message: EMAIL_OR_PHONE_MESSAGE, path: ["phone"] });
    }
  });

export type ContactFormValues = z.infer<typeof contactFormSchema>;
