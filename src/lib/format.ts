/*
 * Tarih/sayı biçimlendirme. Saat dilimi sabitlendiği için sunucu ve
 * tarayıcı aynı çıktıyı üretir (hydration uyuşmazlığı oluşmaz).
 */

const TIME_ZONE = "Europe/Istanbul";

const longDate = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const shortDate = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const count = new Intl.NumberFormat("tr-TR");

function toDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "22 Eylül 2026" */
export function formatDate(value: string | Date): string {
  const date = toDate(value);
  return date ? longDate.format(date) : "";
}

/** "22 Eyl 2026" */
export function formatShortDate(value: string | Date): string {
  const date = toDate(value);
  return date ? shortDate.format(date) : "";
}

/** "22 Eyl 2026 21:38" */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  return date ? dateTime.format(date) : "";
}

/** 1284 → "1.284" */
export function formatCount(value: number): string {
  return count.format(value);
}

/** 249 → "4:09" */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** 1050 → "17 dk" */
export function formatDurationLong(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  return minutes < 60
    ? `${minutes} dk`
    : `${Math.floor(minutes / 60)} sa ${minutes % 60} dk`;
}
