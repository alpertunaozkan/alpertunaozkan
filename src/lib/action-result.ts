/*
 * Sunucu işlemlerinin (Server Actions) sonucu. Beklenen hatalar (doğrulama,
 * çakışma, bulunamadı) fırlatılmaz, kullanıcıya gösterilecek metinle
 * döndürülür; üretimde fırlatılan hataların metni istemciye iletilmez.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** İstemcide: başarısız sonucu, form alanı hatalarıyla birlikte fırlatılabilir hataya çevirir. */
export class ActionError extends Error {
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ActionError";
    this.fieldErrors = fieldErrors;
  }
}

export function unwrapAction<T>(result: ActionResult<T>): T {
  if (result.ok) return result.data;
  throw new ActionError(result.error, result.fieldErrors);
}

/** Toast vb. için kullanıcıya gösterilecek hata metni. */
export function errorMessage(error: unknown, fallback = "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."): string {
  return error instanceof ActionError ? error.message : fallback;
}
