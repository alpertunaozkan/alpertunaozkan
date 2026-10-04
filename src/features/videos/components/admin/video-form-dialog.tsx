"use client";

import { useState, type FormEvent } from "react";
import { CircleCheck, Clapperboard, ImageOff, LoaderCircle, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, fieldAria } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ActionError, errorMessage } from "@/lib/action-result";
import { formatDuration } from "@/lib/format";
import { hasErrors, issuesToFieldErrors, type FieldErrors } from "@/lib/validation";
import { parseYouTubeId } from "@/lib/youtube";
import type { Article, Category, ImageAsset, Video, VideoInput } from "@/types";
import { parseDuration, videoFormSchema, type VideoFormValues } from "../../schema";
import { findYouTubeCover, useYouTubeCover } from "../../youtube-cover";
import { VideoThumbnail } from "../video-thumbnail";

interface VideoFormDialogProps {
  open: boolean;
  /** Düzenlenen video; yeni kayıtta undefined. */
  video?: Video;
  videos: Video[];
  categories: Category[];
  articles: Article[];
  onClose: () => void;
  onSubmit: (input: VideoInput) => Promise<void>;
}

const EMPTY_VALUES: VideoFormValues = {
  title: "",
  youtube: "",
  description: "",
  categoryId: null,
  duration: "",
  relatedArticleSlug: null,
};

const VIDEO_NOT_FOUND = "Bu bağlantıya ait bir YouTube videosu bulunamadı. Linki veya video ID'sini kontrol edin.";

function toFormValues(video: Video): VideoFormValues {
  return {
    title: video.title,
    youtube: video.youtubeId,
    description: video.description,
    categoryId: video.category?.id ?? null,
    duration: video.durationSeconds ? formatDuration(video.durationSeconds) : "",
    relatedArticleSlug: video.relatedArticleSlug,
  };
}

export function VideoFormDialog(props: VideoFormDialogProps) {
  // Her açılışta form durumunun sıfırlanması için içerik yeniden bağlanır.
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      size="xl"
      title={props.video ? "Videoyu düzenle" : "Yeni video"}
      description="YouTube'daki videonun bağlantısını veya ID'sini girin; kapak görseli YouTube'dan otomatik alınır."
    >
      {props.open ? <VideoForm key={props.video?.id ?? "yeni"} {...props} /> : null}
    </Modal>
  );
}

function VideoForm({ video, videos, categories, articles, onClose, onSubmit }: VideoFormDialogProps) {
  const { notify } = useToast();
  const [values, setValues] = useState<VideoFormValues>(video ? toFormValues(video) : EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const youtubeId = parseYouTubeId(values.youtube);
  const category = categories.find((item) => item.id === values.categoryId);
  // Kayıtlı videonun ID'si değişmediyse mevcut kapak geçerlidir; aksi hâlde YouTube'dan bulunur.
  const keepsCover = Boolean(video && youtubeId === video.youtubeId);
  const coverState = useYouTubeCover(keepsCover ? null : youtubeId);
  const previewCover: ImageAsset | null =
    keepsCover && video
      ? video.coverImage
      : coverState.status === "found"
        ? { ...coverState.cover, alt: values.title }
        : null;

  function update<K extends keyof VideoFormValues>(key: K, value: VideoFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = videoFormSchema.safeParse(values);
    const nextErrors: FieldErrors = parsed.success ? {} : issuesToFieldErrors(parsed.error.issues);

    const duplicate = youtubeId ? videos.find((item) => item.youtubeId === youtubeId && item.id !== video?.id) : undefined;
    if (!nextErrors.youtube && duplicate) {
      nextErrors.youtube = `Bu YouTube videosu zaten eklenmiş: “${duplicate.title}”`;
    }

    if (!parsed.success || hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const id = parseYouTubeId(parsed.data.youtube) ?? "";
      // Kapağı bulunamayan video (yanlış ID, silinmiş veya gizli video) eklenmez.
      if (!keepsCover && !(await findYouTubeCover(id))) {
        setErrors({ youtube: VIDEO_NOT_FOUND });
        return;
      }
      await onSubmit({
        title: parsed.data.title,
        youtubeId: id,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        durationSeconds: parseDuration(parsed.data.duration),
        relatedArticleSlug: parsed.data.relatedArticleSlug,
      });
    } catch (error) {
      // Sunucunun bildirdiği alan hataları (ör. aynı video zaten ekli) formda gösterilir.
      if (error instanceof ActionError && error.fieldErrors) setErrors(error.fieldErrors);
      notify({ tone: "error", title: "Video kaydedilemedi", description: errorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <Field id="video-title" label="Başlık" required error={errors.title}>
          <Input
            {...fieldAria("video-title", errors.title)}
            value={values.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="örn. Muris Muvazaası (Mirastan Mal Kaçırma)"
          />
        </Field>

        <Field
          id="video-youtube"
          label="YouTube linki veya video ID"
          required
          error={errors.youtube}
          hint={<YouTubeHint youtubeId={youtubeId} missing={!keepsCover && coverState.status === "missing"} />}
        >
          <Input
            {...fieldAria("video-youtube", errors.youtube, true)}
            value={values.youtube}
            onChange={(event) => update("youtube", event.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            spellCheck={false}
            autoCapitalize="none"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="video-category" label="Kategori" error={errors.categoryId}>
            <Select
              {...fieldAria("video-category", errors.categoryId)}
              value={values.categoryId ?? ""}
              onChange={(event) => update("categoryId", event.target.value || null)}
            >
              <option value="">— Kategori seçin —</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="video-duration" label="Süre (dk:sn)" error={errors.duration} hint="İsteğe bağlı, örn. 4:09">
            <Input
              {...fieldAria("video-duration", errors.duration, true)}
              value={values.duration}
              onChange={(event) => update("duration", event.target.value)}
              inputMode="numeric"
              placeholder="4:09"
            />
          </Field>
        </div>

        <Field id="video-description" label="Açıklama" error={errors.description}>
          <Textarea
            {...fieldAria("video-description", errors.description)}
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            rows={4}
            maxLength={600}
          />
        </Field>

        <Field id="video-article" label="İlgili makale" hint="Video kartında ve makale sayfasında çapraz bağlantı olarak gösterilir.">
          <Select
            {...fieldAria("video-article", undefined, true)}
            value={values.relatedArticleSlug ?? ""}
            onChange={(event) => update("relatedArticleSlug", event.target.value || null)}
          >
            <option value="">— Yok —</option>
            {articles.map((article) => (
              <option key={article.id} value={article.slug}>
                {article.title}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-sm font-medium text-navy-950">Kapak görseli</p>
        <p className="text-xs leading-relaxed text-slate-500">
          {"YouTube'daki videonun kendi kapağı kullanılır; ayrıca görsel eklemenize gerek yoktur."}
        </p>
        <div className="mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {previewCover ? (
            <VideoThumbnail
              video={{ coverImage: previewCover, durationSeconds: parseDuration(values.duration) }}
              sizes="20rem"
            />
          ) : (
            <CoverPlaceholder
              status={!youtubeId ? "idle" : coverState.status === "missing" ? "missing" : "loading"}
            />
          )}
          <div className="p-4">
            {category ? <Badge tone="gold">{category.name}</Badge> : null}
            <p className="mt-2 line-clamp-2 font-serif text-base leading-snug font-semibold text-navy-950">
              {values.title || "Video başlığı"}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500">Sitedeki video kartında bu şekilde görünür.</p>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5 lg:col-span-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          {video ? "Değişiklikleri kaydet" : "Videoyu ekle"}
        </Button>
      </div>
    </form>
  );
}

function YouTubeHint({ youtubeId, missing }: { youtubeId: string | null; missing: boolean }) {
  if (!youtubeId) return "youtube.com/watch?v=…, youtu.be/… veya doğrudan 11 karakterlik ID";
  if (missing) {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-800">
        <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
        {"YouTube'da bu ID ile video bulunamadı: "}
        <code className="font-mono">{youtubeId}</code>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-emerald-700">
      <CircleCheck className="size-3.5 shrink-0" aria-hidden="true" />
      Video ID: <code className="font-mono">{youtubeId}</code>
    </span>
  );
}

function CoverPlaceholder({ status }: { status: "idle" | "loading" | "missing" }) {
  const content = {
    idle: { icon: <Clapperboard aria-hidden="true" />, text: "YouTube linki girildiğinde videonun kapağı burada görünür." },
    loading: {
      icon: <LoaderCircle className="animate-spin" aria-hidden="true" />,
      text: "Kapak görseli YouTube'dan alınıyor…",
    },
    missing: { icon: <ImageOff aria-hidden="true" />, text: "Bu bağlantıya ait YouTube videosu bulunamadı." },
  }[status];

  return (
    <div
      role="status"
      className="flex aspect-video flex-col items-center justify-center gap-2 bg-slate-50 px-6 text-center text-slate-400 [&_svg]:size-7"
    >
      {content.icon}
      <span className="text-xs leading-relaxed text-slate-600">{content.text}</span>
    </div>
  );
}
