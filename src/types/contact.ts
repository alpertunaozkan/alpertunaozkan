import type { ISODateString } from "./common";

export type ContactMessageStatus = "unread" | "read" | "archived";

/** İletişim formundan gelen mesaj (eski API'de "iletisim" koleksiyonu). */
export interface ContactMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: ISODateString;
}

/** Public iletişim formunun gönderdiği gövde. */
export interface ContactFormInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}
