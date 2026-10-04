import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Kullanıcı adı gerekli").max(100, "Kullanıcı adı çok uzun"),
  password: z.string().min(1, "Şifre gerekli").max(200, "Şifre çok uzun"),
});

export interface LoginState {
  status: "idle" | "error";
  message?: string;
  username: string;
  fieldErrors: { username?: string; password?: string };
}

export const initialLoginState: LoginState = { status: "idle", username: "", fieldErrors: {} };

/** Girişten sonra dönülecek panel adresi; yalnızca /admin altı kabul edilir (açık yönlendirme engeli). */
export function safeAdminPath(value: unknown): string {
  const safe =
    typeof value === "string" &&
    /^\/admin(\/[\w\-/?=&%.]*)?$/.test(value) &&
    // "//" ve ".." ile /admin dışına çıkan adresler (ör. /admin/..//başka-site) kabul edilmez.
    !value.includes("//") &&
    !value.includes("..") &&
    !value.startsWith("/admin/login");
  return safe ? value : "/admin/dashboard";
}
