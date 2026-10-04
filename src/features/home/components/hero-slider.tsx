"use client";

/**
 * ANA SAYFA SLIDER'I — GÖRSEL TASARIMI KORUNMUŞTUR, DEĞİŞTİRMEYİN.
 *
 * Eski projedeki `src/features/anasayfa/components/HeroSlider.tsx` bileşeninin
 * birebir aktarımıdır. DOM yapısı, Tailwind sınıfları, süreler ve etkileşim
 * davranışı aynıdır. Paylaşılan UI bileşenlerine (Button/Badge/Container vb.)
 * bilinçli olarak bağımlı değildir; eski bileşenlerin ürettiği nihai sınıflar
 * burada sabitlenmiştir. Böylece tasarım sistemi değişse bile slider etkilenmez.
 *
 * Görsel sonucu değiştirmeyen teknik uyarlamalar:
 * - Mobil/masaüstü görsel seçimi JS state yerine <picture>/<source> ile yapılır
 *   (aynı 831px kırılımı; mobilde gereksiz masaüstü görseli indirilmez).
 * - Slayt başlıkları h1 yerine h2'dir (sayfada tek h1 olsun diye); stil aynıdır.
 * - Pasif slaytlar aria-hidden yerine `inert` ile işaretlenir (klavye odağı
 *   görünmeyen slayta gitmez).
 * - "Detaylı Bilgi" <a><button> iç içe yapısı yerine aynı sınıflara sahip tek
 *   bir <a> olarak işlenir (geçerli HTML).
 * - Animasyon döngüsü, media query takibi ve pasif touch dinleyicilerindeki
 *   etkisiz preventDefault çağrısı güncel React kurallarına göre düzenlendi.
 */

import Link from "next/link";
import { getImageProps } from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { heroSlides, type HeroSlide } from "@/data/slides";

const SLIDE_DURATION = 5000;
const SWIPE_THRESHOLD_RATIO = 0.15;
const HOLD_DELAY_MS = 150;
const TAP_SLOP_PX = 6;
/** Eski koddaki `window.innerWidth < 442` koşuluyla aynı: ilerleme çubuğu en alta iner. */
const TIGHT_PROGRESS_QUERY = "(max-width: 441px)";
/** Eski koddaki `(max-width: 831px)` mobil görsel kırılımı. */
const MOBILE_IMAGE_MEDIA = "(max-width: 831px)";

/* Eski Container bileşeninin ürettiği sınıflar (clsx ile birleştiriliyordu). */
const CONTAINER = "px-4 sm:px-6 lg:px-16";

/*
 * Eski projenin teması Tailwind radius/ring değerlerini değiştiriyordu
 * (--radius: 0.625rem → rounded-md = 8px, rounded-xl = 14px;
 * --ring: oklch(0.704 0.04 256.788)). Aynı görünüm için bu değerler burada
 * sabitlendi; yeni sitenin tema token'larından etkilenmez.
 */
/* Eski <Badge variant="glass" size="sm" className="cursor-pointer" /> çıktısı. */
const FEATURE_BADGE_CLASS =
  "inline-flex items-center rounded-[8px] border font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.704_0.04_256.788)] focus-visible:ring-offset-2 border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:text-white/90 px-2 py-1 text-sm cursor-pointer";

/* Eski <Button size="lg" className="bg-blue-800 ..." /> çıktısı. */
const DETAIL_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[oklch(0.704_0.04_256.788)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-white h-10 bg-blue-800 font-semibold px-8 py-4 rounded-[14px] shadow-lg transition-all duration-300 ease-out hover:bg-blue-600 hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:outline-none";

function subscribeToTightProgress(onChange: () => void) {
  const query = window.matchMedia(TIGHT_PROGRESS_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getTightProgress = () => window.matchMedia(TIGHT_PROGRESS_QUERY).matches;
const getServerTightProgress = () => false;

export function HeroSlider() {
  const slidesLen = heroSlides.length;
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const tightProgress = useSyncExternalStore(
    subscribeToTightProgress,
    getTightProgress,
    getServerTightProgress,
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const bottomProgressRef = useRef<HTMLSpanElement>(null);

  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const holdTimer = useRef<number | null>(null);
  const acc = useRef(0);

  // Otomatik ilerleme: aktif ilerleme çubuğunu her karede günceller.
  useEffect(() => {
    let frame = 0;
    let last = 0;

    const tick = (ts: number) => {
      if (!last) last = ts;
      const delta = ts - last;
      last = ts;

      if (!pausedRef.current && !draggingRef.current) {
        acc.current += delta;
        const frac = Math.min(acc.current / SLIDE_DURATION, 1);

        const bar = tightProgress ? bottomProgressRef.current : progressRef.current;
        if (bar) bar.style.width = `${frac * 100}%`;

        if (acc.current >= SLIDE_DURATION) {
          acc.current = 0;
          if (bar) bar.style.width = "0%";
          setIndex((prev) => (prev + 1) % slidesLen);
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [slidesLen, tightProgress]);

  const drag = useRef<{
    active: boolean;
    startX: number;
    lastX: number;
    width: number;
    startedDragging: boolean;
    activeType: "pointer" | "touch" | null;
    pointerId: number | null;
    pointerCaptured: boolean;
  }>({
    active: false,
    startX: 0,
    lastX: 0,
    width: 1,
    startedDragging: false,
    activeType: null,
    pointerId: null,
    pointerCaptured: false,
  });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const resize = () => {
      drag.current.width = el.clientWidth || 1;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clearHold = () => {
    if (holdTimer.current !== null) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const startInteraction = (clientX: number, type: "pointer" | "touch", pointerId: number | null = null) => {
    drag.current.active = true;
    drag.current.activeType = type;
    drag.current.startedDragging = false;
    drag.current.startX = clientX;
    drag.current.lastX = clientX;
    drag.current.pointerId = pointerId;
    drag.current.pointerCaptured = false;
    draggingRef.current = false;

    clearHold();
    holdTimer.current = window.setTimeout(() => {
      if (!drag.current.startedDragging) pausedRef.current = true;
    }, HOLD_DELAY_MS);
  };

  const moveInteraction = (clientX: number, preventDefault?: () => void): boolean => {
    if (!drag.current.active) return false;
    const dx = clientX - drag.current.startX;
    drag.current.lastX = clientX;

    if (!drag.current.startedDragging && Math.abs(dx) >= TAP_SLOP_PX) {
      drag.current.startedDragging = true;
      clearHold();
      pausedRef.current = true;
      draggingRef.current = true;
    }

    if (drag.current.startedDragging) {
      preventDefault?.();
      setOffset((dx / drag.current.width) * 100);
    }

    return drag.current.startedDragging;
  };

  const releasePointerCapture = () => {
    const el = trackRef.current;
    if (
      !drag.current.pointerCaptured ||
      drag.current.pointerId === null ||
      !el ||
      typeof el.releasePointerCapture !== "function"
    ) {
      return;
    }
    try {
      el.releasePointerCapture(drag.current.pointerId);
    } catch {
      // Safari iOS pointer capture desteklemiyor; yok sayılabilir.
    }
    drag.current.pointerCaptured = false;
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== "mouse") return; // dokunmatik girişi native touch handler yönetir
    startInteraction(e.clientX, "pointer", e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (e.pointerType !== "mouse" || !drag.current.active || drag.current.activeType !== "pointer") {
      return;
    }
    const startedNow = moveInteraction(e.clientX, () => e.preventDefault());

    const el = trackRef.current;
    if (
      startedNow &&
      !drag.current.pointerCaptured &&
      drag.current.pointerId !== null &&
      el &&
      typeof el.setPointerCapture === "function"
    ) {
      try {
        el.setPointerCapture(drag.current.pointerId);
        drag.current.pointerCaptured = true;
      } catch {
        // Pointer capture yoksa (Safari iOS <17) sürükleme yine çalışır.
      }
    }
  };

  const finishInteraction = (type?: "pointer" | "touch") => {
    if (!drag.current.active) return;
    if (type && drag.current.activeType && type !== drag.current.activeType) return;

    if (drag.current.pointerCaptured) {
      releasePointerCapture();
    }

    const dx = drag.current.lastX - drag.current.startX;
    const threshold = drag.current.width * SWIPE_THRESHOLD_RATIO;

    if (drag.current.startedDragging) {
      if (dx <= -threshold) {
        setIndex((prev) => (prev < slidesLen - 1 ? prev + 1 : 0));
      } else if (dx >= threshold) {
        setIndex((prev) => (prev > 0 ? prev - 1 : slidesLen - 1));
      }
      acc.current = 0;

      // iki çubuğu da sıfırla
      if (progressRef.current) progressRef.current.style.width = "0%";
      if (bottomProgressRef.current) bottomProgressRef.current.style.width = "0%";
    }

    drag.current.active = false;
    drag.current.startedDragging = false;
    draggingRef.current = false;
    setOffset(0);
    pausedRef.current = false;
    clearHold();
    drag.current.activeType = null;
    drag.current.pointerId = null;
    drag.current.pointerCaptured = false;
  };

  const onTouchStart = (e: ReactTouchEvent) => {
    if (drag.current.active || e.touches.length !== 1) return;
    startInteraction(e.touches[0].clientX, "touch");
  };

  const onTouchMove = (e: ReactTouchEvent) => {
    if (!drag.current.active || drag.current.activeType !== "touch") return;
    const touch = e.touches[0];
    if (!touch) return;
    // React touch dinleyicileri pasif olduğu için preventDefault etkisizdir;
    // yatay kaydırmayı `touch-action: pan-y` zaten engeller.
    moveInteraction(touch.clientX);
  };

  const onTouchEnd = () => finishInteraction("touch");
  const onTouchCancel = () => finishInteraction("touch");

  const jumpTo = (i: number) => {
    setIndex(i);
    acc.current = 0;
    if (progressRef.current) progressRef.current.style.width = "0%";
    if (bottomProgressRef.current) bottomProgressRef.current.style.width = "0%";
    pausedRef.current = false;
  };

  const transform = `translateX(${-index * 100 + offset}%)`;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <section
      id="hero-slider"
      className="relative w-full h-[calc(100dvh-72px)] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 touch-pan-y [&_*]:touch-pan-y"
      aria-label="Ana görsel slayt"
      aria-roledescription="carousel"
    >
      <div className="w-full h-full select-none">
        <div
          ref={trackRef}
          className={`flex h-full will-change-transform ${
            offset !== 0 ? "transition-none" : "transition-transform duration-700 ease-in-out"
          }`}
          style={{
            transform,
            touchAction: "pan-y",
            backfaceVisibility: "hidden",
            overscrollBehaviorX: "contain",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => {
            if (e.pointerType === "mouse") finishInteraction("pointer");
          }}
          onPointerCancel={(e) => {
            if (e.pointerType === "mouse") finishInteraction("pointer");
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") finishInteraction("pointer");
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
        >
          {heroSlides.map((slide, i) => (
            <div
              key={i}
              className="relative w-full h-full flex-[0_0_100%]"
              inert={i !== index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${slidesLen}`}
            >
              <SlideImage slide={slide} priority={i === 0} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex justify-start">
                <div className={`${CONTAINER} h-full flex items-start sm:items-center pt-8 sm:pt-0`}>
                  <div className="space-y-8 max-w-4xl">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                          <span className="block bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                            {slide.title}
                          </span>
                        </h2>
                        <span
                          aria-hidden
                          className="ml-6 hidden md:inline-block w-[3px] md:h-12 lg:h-16 bg-gradient-to-b from-transparent via-yellow-600 to-transparent rounded"
                        />
                      </div>
                      <SliderSeparator />
                    </div>
                    <p className="text-lg md:text-xl lg:text-2xl text-gray-200 leading-relaxed max-w-2xl font-light">
                      {slide.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {slide.features.map((feature, idx) => (
                        <Link key={idx} href="/faaliyet-alanlarim">
                          <span className={FEATURE_BADGE_CLASS}>{feature}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-6">
                      <Link href="/faaliyet-alanlarim" className={DETAIL_BUTTON_CLASS}>
                        Detaylı Bilgi
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Üst kontrol grubu */}
      <div className="absolute inset-x-0 bottom-8 z-20">
        <div className={CONTAINER}>
          <div className="flex justify-center">
            <div className="flex items-center gap-4 rounded-2xl bg-black/50 backdrop-blur px-4 py-2 border border-white/10 shadow">
              {/* Dots */}
              <div className="flex items-center gap-2">
                {heroSlides.map((_, i) => {
                  const active = i === index;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => jumpTo(i)}
                      aria-label={`${i + 1}. slayda git`}
                      aria-current={active ? "true" : "false"}
                      className="group relative inline-flex items-center justify-center w-10 h-10 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80 bg-transparent"
                    >
                      <span
                        aria-hidden
                        className={`block rounded-full transition ${
                          active ? "size-3 bg-yellow-500 shadow" : "size-2.5 bg-white/70 group-hover:bg-white"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Ayraç & yan progress */}
              {!tightProgress && (
                <>
                  <span className="w-px h-5 bg-white/20" />
                  <div className="flex w-28 md:w-36 h-2 rounded-full bg-white/10 overflow-hidden">
                    <span
                      ref={progressRef}
                      className="h-full bg-white/70"
                      style={{ width: "0%", transition: "width 80ms linear" }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {tightProgress && (
        <div className="absolute inset-x-0 bottom-[16px] z-20">
          <div className={CONTAINER}>
            <div className="w-full max-w-md mx-auto h-2 rounded-full bg-black/30 backdrop-blur border border-white/10 overflow-hidden">
              <span
                ref={bottomProgressRef}
                className="block h-full bg-white/70"
                style={{ width: "0%", transition: "width 80ms linear" }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Eski projedeki Radix <Separator className="w-24 h-[3px] bg-yellow-600" />
 * çıktısının aynısı. Not: data-orientation varyant sınıfları daha yüksek
 * özgüllüğe sahip olduğu için eski sitede bu çizgi 1px yükseklikte ve tam
 * genişlikte görünür; bu görünüm bilinçli olarak korunmuştur.
 */
function SliderSeparator() {
  return (
    <div
      role="none"
      data-slot="separator"
      data-orientation="horizontal"
      className="shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px w-24 h-[3px] bg-yellow-600"
    />
  );
}

function SlideImage({ slide, priority }: { slide: HeroSlide; priority: boolean }) {
  const common = {
    alt: slide.title,
    fill: true,
    sizes: "100vw",
    quality: priority ? 55 : 60,
  } as const;

  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({ ...common, src: slide.mobileImage });
  const { props: imageProps } = getImageProps({
    ...common,
    src: slide.image,
    loading: priority ? "eager" : "lazy",
    fetchPriority: priority ? "high" : "auto",
  });

  return (
    <picture>
      <source media={MOBILE_IMAGE_MEDIA} srcSet={mobileSrcSet} sizes="100vw" />
      {/* Art direction: next/image getImageProps ile üretilen optimize srcset'ler. */}
      <img
        {...imageProps}
        alt={slide.title}
        draggable={false}
        className="object-cover sm:object-top object-center select-none pointer-events-none"
      />
    </picture>
  );
}
