import { useEffect, useState, type RefObject } from "react";

/**
 * Native <dialog>'u `open` değerine göre modal olarak açıp kapatır ve dönen
 * değerle içeriğin ne zaman render edileceğini söyler: kapanırken içerik,
 * dialog'un kapanış animasyonu bitene kadar DOM'da kalır. Animasyon yoksa
 * (eski tarayıcı veya "hareketi azalt" tercihi) içerik hemen kaldırılır.
 */
export function useDialogPresence(dialogRef: RefObject<HTMLDialogElement | null>, open: boolean): boolean {
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();

    // Yalnızca dialog'un kendi geçişleri beklenir (içerikteki sonsuz animasyonlar,
    // ör. yükleniyor simgesi, kaldırmayı geciktirmesin).
    const closing = dialog
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity);
    let cancelled = false;
    void Promise.allSettled(closing.map((animation) => animation.finished)).then(() => {
      if (!cancelled) setPresent(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dialogRef, open]);

  return present;
}
