import type { ContactFormInput } from "@/types";

export type ContactFormField = keyof ContactFormInput;

export interface ContactFormState {
  status: "idle" | "error" | "success";
  message?: string;
  /** Hata durumunda kullanıcının girdiği değerler korunur. */
  values: ContactFormInput;
  fieldErrors: Partial<Record<ContactFormField, string>>;
}

export const EMPTY_CONTACT_VALUES: ContactFormInput = { name: "", email: "", phone: "", subject: "", message: "" };

export const initialContactFormState: ContactFormState = {
  status: "idle",
  values: EMPTY_CONTACT_VALUES,
  fieldErrors: {},
};

/**
 * Botları ayırt etmek için görünmez alan: insanlar doldurmaz (ekranda ve
 * klavye sırasında yoktur); dolu gelen gönderim kaydedilmez.
 */
export const CONTACT_HONEYPOT_FIELD = "website";
