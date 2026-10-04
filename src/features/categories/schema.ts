import { z } from "zod";

/** Eski API ile aynı alt sınır (ad ≥ 2 karakter). */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Kategori adı en az 2 karakter olmalıdır")
    .max(60, "Kategori adı en fazla 60 karakter olabilir"),
});
