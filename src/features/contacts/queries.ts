import "server-only";

import { cache } from "react";
import { getCollections } from "@/server/db";
import { requireAdmin } from "@/server/dal";
import { toContactMessage } from "@/server/mappers";
import type { ContactMessage } from "@/types";

/** Panel: iletişim formundan gelen mesajlar (en yeni önce). */
export const getContactMessages = cache(async (): Promise<ContactMessage[]> => {
  await requireAdmin();
  const { contactMessages } = await getCollections();
  const docs = await contactMessages.find({}, { sort: { createdAt: -1, _id: -1 } }).toArray();
  return docs.map(toContactMessage);
});
