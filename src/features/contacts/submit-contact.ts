"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { getCollections } from "@/server/db";
import { getClientIp, hitRateLimit } from "@/server/rate-limit";
import type { ContactFormInput } from "@/types";
import {
  CONTACT_HONEYPOT_FIELD,
  EMPTY_CONTACT_VALUES,
  type ContactFormField,
  type ContactFormState,
} from "./contact-form-state";
import { contactFormSchema } from "./schema";

/** Aynı IP'den saatte en fazla 5 mesaj. */
const CONTACT_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };
const SUCCESS_MESSAGE = "Mesajınız başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.";

function readValues(formData: FormData): ContactFormInput {
  const read = (key: ContactFormField) => String(formData.get(key) ?? "").trim();
  return {
    name: read("name"),
    email: read("email"),
    phone: read("phone"),
    subject: read("subject"),
    message: read("message"),
  };
}

/** Sitedeki iletişim formu: mesajı doğrular ve panelin "Mesajlar" bölümüne kaydeder. */
export async function submitContactForm(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = readValues(formData);
  const success: ContactFormState = { status: "success", message: SUCCESS_MESSAGE, values: EMPTY_CONTACT_VALUES, fieldErrors: {} };

  // Bot: kaydedilmez, ancak başarılı gibi yanıtlanır.
  if (String(formData.get(CONTACT_HONEYPOT_FIELD) ?? "").trim()) return success;

  const parsed = contactFormSchema.safeParse(values);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      status: "error",
      message: "Lütfen işaretli alanları kontrol edin.",
      values,
      fieldErrors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        phone: fieldErrors.phone?.[0],
        subject: fieldErrors.subject?.[0],
        message: fieldErrors.message?.[0],
      },
    };
  }

  try {
    const rate = await hitRateLimit(`contact:${await getClientIp()}`, CONTACT_LIMIT);
    if (rate.count > CONTACT_LIMIT.limit) {
      return {
        status: "error",
        message: "Kısa sürede çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin veya bizi telefonla arayın.",
        values,
        fieldErrors: {},
      };
    }

    const { contactMessages } = await getCollections();
    await contactMessages.insertOne({
      _id: new ObjectId(),
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      // Tarayıcılar form satır sonlarını CRLF gönderir; tek biçimde (\n) saklanır.
      message: parsed.data.message.replace(/\r\n?/g, "\n"),
      status: "unread",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[iletişim formu]", error);
    return {
      status: "error",
      message: "Mesajınız şu anda gönderilemedi. Lütfen biraz sonra tekrar deneyin veya bizi telefonla arayın.",
      values,
      fieldErrors: {},
    };
  }

  return success;
}
