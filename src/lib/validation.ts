import type { z } from "zod";

/** Alan yolu ("coverImage.alt" gibi) → ilk hata mesajı. */
export type FieldErrors = Record<string, string | undefined>;

export function issuesToFieldErrors(issues: readonly z.core.$ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
