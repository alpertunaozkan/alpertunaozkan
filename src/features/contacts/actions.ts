"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { runAction, UserError } from "@/server/action";
import { getCollections } from "@/server/db";
import { requireAdmin } from "@/server/dal";
import { parseObjectId, toContactMessage } from "@/server/mappers";
import type { ContactMessage, ContactMessageStatus } from "@/types";

const statusSchema = z.enum(["unread", "read", "archived"]);

export async function setContactStatusAction(id: string, status: ContactMessageStatus): Promise<ActionResult<ContactMessage>> {
  return runAction(async () => {
    await requireAdmin();
    const parsed = statusSchema.safeParse(status);
    if (!parsed.success) throw new UserError("Geçersiz durum.");

    const objectId = parseObjectId(id);
    const { contactMessages } = await getCollections();
    const updated = objectId
      ? await contactMessages.findOneAndUpdate({ _id: objectId }, { $set: { status: parsed.data } }, { returnDocument: "after" })
      : null;
    if (!updated) throw new UserError("Mesaj bulunamadı; silinmiş olabilir.");
    return toContactMessage(updated);
  });
}

export async function deleteContactMessageAction(id: string): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireAdmin();
    const objectId = parseObjectId(id);
    const { contactMessages } = await getCollections();
    const result = objectId ? await contactMessages.deleteOne({ _id: objectId }) : null;
    if (!result?.deletedCount) throw new UserError("Mesaj bulunamadı; zaten silinmiş olabilir.");
    return { id };
  });
}
