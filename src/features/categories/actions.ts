"use server";

import { MongoServerError, ObjectId } from "mongodb";
import type { ActionResult } from "@/lib/action-result";
import { uniqueSlug } from "@/lib/slugify";
import { revalidatePublicSite, runAction, UserError } from "@/server/action";
import { getCollections } from "@/server/db";
import { requireAdmin } from "@/server/dal";
import type { CategoryDocument } from "@/server/documents";
import { parseObjectId, toCategory } from "@/server/mappers";
import type { Category, CategoryInput } from "@/types";
import { categoryFormSchema } from "./schema";

/** Kategori adları büyük/küçük harf (Türkçe) gözetmeksizin benzersizdir. */
const TURKISH_CASE_INSENSITIVE = { locale: "tr", strength: 2 } as const;
const NAME_TAKEN = "Bu adla bir kategori zaten var";

export async function saveCategoryAction(input: CategoryInput, id?: string): Promise<ActionResult<Category>> {
  return runAction(async () => {
    await requireAdmin();

    const parsed = categoryFormSchema.safeParse(input);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Geçersiz kategori adı";
      throw new UserError(message, { name: message });
    }
    const name = parsed.data.name.replace(/\s+/g, " ");
    const c = await getCollections();

    const objectId = id ? parseObjectId(id) : null;
    const existing = objectId ? await c.categories.findOne({ _id: objectId }) : null;
    if (id && !existing) throw new UserError("Kategori bulunamadı; silinmiş olabilir.");

    const others = existing ? { _id: { $ne: existing._id } } : {};
    if (await c.categories.findOne({ ...others, name }, { collation: TURKISH_CASE_INSENSITIVE })) {
      throw new UserError(`${NAME_TAKEN}.`, { name: NAME_TAKEN });
    }

    const takenSlugs = await c.categories.distinct("slug", others);
    const now = new Date();
    const fields = { name, slug: uniqueSlug(name, takenSlugs), updatedAt: now } satisfies Partial<CategoryDocument>;

    let saved: CategoryDocument;
    try {
      if (existing) {
        await c.categories.updateOne({ _id: existing._id }, { $set: fields });
        saved = { ...existing, ...fields };
      } else {
        saved = { _id: new ObjectId(), ...fields, createdAt: now };
        await c.categories.insertOne(saved);
      }
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new UserError(`${NAME_TAKEN}.`, { name: NAME_TAKEN });
      }
      throw error;
    }

    revalidatePublicSite();
    return toCategory(saved);
  });
}

/** Kategori silinir; o kategorideki makale ve videolar kategorisiz kalır. */
export async function deleteCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireAdmin();
    const objectId = parseObjectId(id);
    const c = await getCollections();
    const result = objectId ? await c.categories.deleteOne({ _id: objectId }) : null;
    if (!result?.deletedCount) throw new UserError("Kategori bulunamadı; zaten silinmiş olabilir.");

    await Promise.all([
      c.articles.updateMany({ categoryId: objectId }, { $set: { categoryId: null } }),
      c.videos.updateMany({ categoryId: objectId }, { $set: { categoryId: null } }),
    ]);
    revalidatePublicSite();
    return { id };
  });
}
