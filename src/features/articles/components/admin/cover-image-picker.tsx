"use client";

import { useId, useRef, useState } from "react";
import { Check, CircleAlert, ImageOff, ImagePlus, Images, LoaderCircle, RefreshCw, Upload } from "lucide-react";
import { EmptyState } from "@/components/admin/admin-ui";
import { FramedImage } from "@/components/common/framed-image";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useMediaLibrary } from "@/features/media/use-media-library";
import { errorMessage } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import type { ImageAsset, MediaAsset } from "@/types";

interface CoverImagePickerProps {
  value: ImageAsset;
  onChange: (value: ImageAsset) => void;
  urlError?: string;
  /** Dar alanlar (ör. video formu) için kısa görünüm. */
  compact?: boolean;
  /** Önizleme çerçevesinin oranı: sitede görselin gösterildiği kartla aynı olmalı. */
  previewRatio?: number;
  /** Önizlemenin altındaki açıklama: görselin sitede nerede, nasıl görüneceği. */
  previewCaption?: string;
}

const COMMON_RATIOS: Array<[number, string]> = [
  [3, "3:1"],
  [21 / 9, "21:9"],
  [2, "2:1"],
  [16 / 9, "16:9"],
  [3 / 2, "3:2"],
  [4 / 3, "4:3"],
  [5 / 4, "5:4"],
  [1, "1:1"],
  [4 / 5, "4:5"],
  [3 / 4, "3:4"],
  [2 / 3, "2:3"],
  [9 / 16, "9:16"],
];

/** "Dikey · 3:4 · 765 × 1020 px" gibi, avukatın anlayacağı kısa açıklama. */
export function describeImage(image: Pick<ImageAsset, "width" | "height">): string | null {
  if (!image.width || !image.height) return null;
  const ratio = image.width / image.height;
  const [, label] = COMMON_RATIOS.reduce((best, current) =>
    Math.abs(Math.log(current[0] / ratio)) < Math.abs(Math.log(best[0] / ratio)) ? current : best,
  );
  const orientation = Math.abs(ratio - 1) < 0.06 ? "Kare" : ratio >= 2.2 ? "Panoramik" : ratio > 1 ? "Yatay" : "Dikey";
  return `${orientation} · ${label} · ${image.width} × ${image.height} px`;
}

/**
 * Dosya adından alt metin önerisi. Kamera / telefon / ekran görüntüsü adları
 * ("IMG_1234", "WhatsApp Image 2026-…") görseli anlatmadığı için önerilmez.
 */
function altFromFileName(name: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const letters = base.replace(/[^a-zçğıöşü]/gi, "");
  const generic = /^(img|image|dsc|dscn|dcim|pxl|photo|foto|whatsapp|screen ?shot|ekran|scan|untitled|adsız)(?![a-zçğıöşü])/i;
  return letters.length < 3 || generic.test(base) ? "" : base;
}

/** Kütüphanedeki görselin dosya adı (Cloudinary public_id'nin son parçası). */
function assetName(asset: MediaAsset): string {
  return asset.publicId.split("/").pop() ?? asset.publicId;
}

/**
 * Kapak görseli seçimi. Görsel her oranda olabilir (yatay, dikey, kare,
 * panoramik); boyutlar Cloudinary'den gelir ve site görseli kırpmadan
 * yerleştirir. Bilgisayardan seçilen dosya doğrudan Cloudinary'ye yüklenir ve
 * görsel kütüphanesine eklenir.
 */
export function CoverImagePicker({
  value,
  onChange,
  urlError,
  compact = false,
  previewRatio = 16 / 10,
  previewCaption = "Sitedeki kartta bu şekilde görünür.",
}: CoverImagePickerProps) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const library = useMediaLibrary();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  // Görselle birlikte otomatik gelen alt metin; avukat elle değiştirmediyse yeni
  // görsel seçildiğinde yenisiyle değişir (eski görselin açıklaması kalmasın).
  const autoAlt = useRef(value.alt);
  const description = value.url ? describeImage(value) : null;

  function nextAlt(suggestion: string): string {
    if (value.alt && value.alt !== autoAlt.current) return value.alt;
    autoAlt.current = suggestion;
    return suggestion;
  }

  function select(asset: MediaAsset, altSuggestion: string) {
    onChange({
      url: asset.url,
      alt: nextAlt(altSuggestion),
      width: asset.width,
      height: asset.height,
      publicId: asset.publicId,
    });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      select(await library.upload(file), altFromFileName(file.name));
    } catch (error) {
      setUploadError(errorMessage(error, "Görsel yüklenemedi. Lütfen tekrar deneyin."));
    } finally {
      setUploading(false);
    }
  }

  function openLibrary() {
    setLibraryOpen(true);
    void library.load();
  }

  return (
    <div className="grid gap-3">
      <figure className="grid gap-1.5">
        <div
          className={cn("overflow-hidden rounded-xl border", urlError ? "border-red-500" : "border-slate-200")}
          style={{ aspectRatio: previewRatio }}
        >
          {value.url ? (
            <FramedImage
              image={value}
              frameRatio={previewRatio}
              sizes={compact ? "20rem" : "(min-width: 1024px) 24rem, 100vw"}
              className="size-full"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400">
              <ImagePlus className="size-8" aria-hidden="true" />
              <span className="text-sm text-slate-600">Kapak görseli seçilmedi</span>
            </div>
          )}
        </div>
        {value.url ? (
          <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-600">
            <span>{previewCaption}</span>
            {description ? <span className="text-slate-500 tabular-nums">{description}</span> : null}
          </figcaption>
        ) : null}
      </figure>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={openLibrary} disabled={uploading}>
          <Images aria-hidden="true" />
          Kütüphaneden seç
        </Button>
        <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
          {uploading ? "Yükleniyor…" : "Bilgisayardan seç"}
        </Button>
        <input
          ref={fileRef}
          id={fileInputId}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      {uploadError ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-red-600 motion-safe:animate-fade-in">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {uploadError}
        </p>
      ) : null}
      <p className="text-xs leading-relaxed text-slate-500">
        Yatay, dikey ya da kare fotoğraf kullanabilirsiniz; site fotoğrafı orantısını bozmadan ve önemli kısmını
        kesmeden yerleştirir.
      </p>

      <Modal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        size="lg"
        title="Görsel kütüphanesi"
        description="Daha önce yüklenen görseller; her biri kırpılmadan, tam hâliyle gösterilir."
      >
        {library.loadError ? (
          <EmptyState
            icon={<ImageOff />}
            title="Görsel kütüphanesi yüklenemedi"
            description={library.loadError}
            action={
              <Button variant="outline" size="sm" onClick={() => void library.load(true)}>
                <RefreshCw aria-hidden="true" />
                Tekrar dene
              </Button>
            }
            className="py-10"
          />
        ) : !library.media ? (
          <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-slate-600">
            <LoaderCircle className="size-5 animate-spin text-slate-400" aria-hidden="true" />
            Görseller yükleniyor…
          </div>
        ) : library.media.length === 0 ? (
          <EmptyState
            icon={<Images />}
            title="Henüz yüklenmiş görsel yok"
            description="“Bilgisayardan seç” ile yüklediğiniz görseller burada listelenir."
            className="py-10"
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {library.media.map((asset) => {
              const selected = asset.url === value.url;
              const assetDescription = describeImage(asset);
              const label = assetDescription ? `${assetName(asset)} (${assetDescription})` : assetName(asset);
              return (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => {
                      select(asset, asset.alt);
                      setLibraryOpen(false);
                    }}
                    aria-pressed={selected}
                    aria-label={label}
                    className={cn(
                      "group relative block w-full overflow-hidden rounded-lg ring-2 ring-offset-2 transition",
                      selected ? "ring-navy-700" : "ring-transparent hover:ring-slate-300",
                    )}
                  >
                    <FramedImage image={asset} frameRatio={4 / 3} fit="contain" sizes="14rem" className="aspect-[4/3]" />
                    {assetDescription ? (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1.5 left-1.5 rounded bg-navy-950/75 px-1.5 py-0.5 text-[11px] font-medium text-white"
                      >
                        {assetDescription.split(" · ").slice(0, 2).join(" · ")}
                      </span>
                    ) : null}
                    {selected ? (
                      <span className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-navy-900 text-white">
                        <Check className="size-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </div>
  );
}
