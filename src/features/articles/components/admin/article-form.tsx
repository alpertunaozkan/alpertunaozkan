"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Eye, LoaderCircle, Save, Trash2, TriangleAlert } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea, fieldAria } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/slugify";
import { estimateReadingMinutes } from "@/lib/text";
import { cn } from "@/lib/utils";
import { hasErrors, issuesToFieldErrors, type FieldErrors } from "@/lib/validation";
import { ActionError, errorMessage } from "@/lib/action-result";
import type { Article, ArticleInput, ArticleStatus, Category, ImageAsset } from "@/types";
import { SUMMARY_IDEAL, articleFormSchema } from "../../schema";
import { ArticlePreviewDialog } from "./article-preview-dialog";
import { ContentEditor } from "./content-editor";
import { CoverImagePicker } from "./cover-image-picker";
import { KeywordInput } from "./keyword-input";
import { SeoPreview } from "./seo-preview";

export interface ArticleFormValues {
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: ImageAsset;
  categoryId: string | null;
  keywords: string[];
  /** null → içerikten otomatik hesaplanır. */
  readingMinutes: number | null;
  status: ArticleStatus;
}

export const EMPTY_ARTICLE_VALUES: ArticleFormValues = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  coverImage: { url: "", alt: "" },
  categoryId: null,
  keywords: [],
  readingMinutes: null,
  status: "draft",
};

export function articleToFormValues(article: Article): ArticleFormValues {
  return {
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    content: article.content,
    coverImage: article.coverImage,
    categoryId: article.category?.id ?? null,
    keywords: article.keywords,
    readingMinutes: article.readingMinutes,
    status: article.status,
  };
}

interface ArticleFormProps {
  /** Düzenlenen makale (yeni makalede undefined). */
  article?: Article;
  initialValues: ArticleFormValues;
  categories: Category[];
  takenSlugs: string[];
  onSubmit: (input: ArticleInput) => Promise<void>;
  onDelete?: () => void;
}

const FORM_ID = "article-form";

export function ArticleForm({
  article,
  initialValues,
  categories,
  takenSlugs,
  onSubmit,
  onDelete,
}: ArticleFormProps) {
  const { notify } = useToast();
  const [values, setValues] = useState(initialValues);
  const [slugEdited, setSlugEdited] = useState(Boolean(article));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [previewOpenedAt, setPreviewOpenedAt] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const autoMinutes = estimateReadingMinutes(values.content);
  const slugChangedOnLive = article?.status === "published" && values.slug !== article.slug;

  // Kaydedilmemiş değişiklik varken sekme kapatma/yenileme uyarısı.
  useEffect(() => {
    if (!isDirty || submitting) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, submitting]);

  function update<K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleTitle(title: string) {
    setValues((current) => ({ ...current, title, slug: slugEdited ? current.slug : slugify(title) }));
    setErrors((current) => ({ ...current, title: undefined, slug: undefined }));
  }

  function handleCover(coverImage: ImageAsset) {
    update("coverImage", coverImage);
    setErrors((current) => ({ ...current, "coverImage.url": undefined, "coverImage.alt": undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input: ArticleInput = {
      ...values,
      title: values.title.trim(),
      slug: slugify(values.slug),
      summary: values.summary.trim(),
      coverImage: { ...values.coverImage, alt: values.coverImage.alt.trim() },
      readingMinutes: values.readingMinutes ?? autoMinutes,
    };

    const parsed = articleFormSchema.safeParse(input);
    const nextErrors: FieldErrors = parsed.success ? {} : issuesToFieldErrors(parsed.error.issues);
    if (!nextErrors.slug && takenSlugs.includes(input.slug)) {
      nextErrors.slug = "Bu adres başka bir makalede kullanılıyor";
    }

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      notify({ tone: "error", title: "Makale kaydedilemedi", description: "Lütfen işaretli alanları kontrol edin." });
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch (error) {
      setSubmitting(false);
      // Sunucunun bildirdiği alan hataları (ör. adres çakışması) formda işaretlenir.
      if (error instanceof ActionError && error.fieldErrors) {
        setErrors((current) => ({ ...current, ...error.fieldErrors }));
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      }
      notify({ tone: "error", title: "Makale kaydedilemedi", description: errorMessage(error) });
    }
  }

  const summaryLength = values.summary.trim().length;
  const summaryTone =
    summaryLength === 0
      ? "text-slate-500"
      : summaryLength >= SUMMARY_IDEAL.min && summaryLength <= SUMMARY_IDEAL.max
        ? "text-emerald-700"
        : "text-amber-700";

  const submitLabel =
    values.status === "draft" ? "Taslağı kaydet" : article?.status === "published" ? "Güncelle" : "Yayınla";

  return (
    <>
      <AdminPageHeader
        title={article ? "Makaleyi düzenle" : "Yeni makale"}
        description={article ? article.title : "Yeni bir makale oluşturun; taslak olarak kaydedip daha sonra yayınlayabilirsiniz."}
        back={{ href: "/admin/makaleler", label: "Makalelere dön" }}
        actions={
          <>
            {article?.status === "published" ? (
              <ButtonLink
                href={`/makalelerim/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
              >
                Sitede görüntüle
                <ArrowUpRight aria-hidden="true" />
              </ButtonLink>
            ) : null}
            <Button variant="outline" onClick={() => setPreviewOpenedAt(new Date().toISOString())}>
              <Eye aria-hidden="true" />
              Önizle
            </Button>
            <Button type="submit" form={FORM_ID} disabled={submitting}>
              {submitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
              {submitLabel}
            </Button>
          </>
        }
      />

      <form id={FORM_ID} ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <Card>
            <CardBody className="grid gap-5">
              <Field id="article-title" label="Başlık" required error={errors.title} hint="Makale sayfasının en üstünde büyük başlık olarak görünür.">
                <Input
                  {...fieldAria("article-title", errors.title, true)}
                  value={values.title}
                  onChange={(event) => handleTitle(event.target.value)}
                  placeholder="örn. Kiracı Hangi Hallerde Tahliye Edilebilir?"
                  className="h-12 text-lg font-semibold"
                />
              </Field>

              <Field
                id="article-slug"
                label="Sayfa adresi"
                required
                error={errors.slug}
                hint={
                  slugChangedOnLive
                    ? undefined
                    : slugEdited
                      ? "Adres elle düzenlendi."
                      : "Başlıktan otomatik oluşturulur."
                }
              >
                <div className="flex overflow-hidden rounded-lg border border-slate-300 focus-within:border-navy-500 focus-within:ring-4 focus-within:ring-navy-500/12 has-aria-invalid:border-red-500">
                  <span className="hidden items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 sm:flex">
                    /makalelerim/
                  </span>
                  <input
                    {...fieldAria("article-slug", errors.slug, true)}
                    value={values.slug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      const typed = event.target.value;
                      // Yazarken sondaki tire/boşluk korunur ki kelimeler ayrılabilsin; tam temizlik
                      // alandan çıkınca ve kaydederken yapılır.
                      const separator = /[\s-]$/.test(typed) ? "-" : "";
                      update("slug", slugify(typed) ? slugify(typed) + separator : typed.toLowerCase().trim());
                    }}
                    onBlur={() => update("slug", slugify(values.slug))}
                    className="h-11 min-w-0 flex-1 border-0 bg-white px-3 text-[15px] text-navy-950 focus:ring-0 focus:outline-none"
                  />
                </div>
                {slugChangedOnLive ? (
                  <p className="flex gap-2 text-xs text-amber-800">
                    <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                    Yayındaki makalenin adresi değişirse eski adres yeni adrese otomatik yönlendirilir; yine de
                    paylaşılmış bağlantılar için adresi gerekmedikçe değiştirmeyin.
                  </p>
                ) : null}
              </Field>

              <Field
                id="article-summary"
                label="Özet"
                error={errors.summary}
                hint="Makale kartlarında ve arama sonuçlarında (meta açıklama) kullanılır."
                aside={
                  <span className={cn("text-xs tabular-nums", summaryTone)}>
                    {summaryLength} / {SUMMARY_IDEAL.min}–{SUMMARY_IDEAL.max} ideal
                  </span>
                }
              >
                <Textarea
                  {...fieldAria("article-summary", errors.summary, true)}
                  value={values.summary}
                  onChange={(event) => update("summary", event.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="İçeriğin özünü anlatan kısa bir açıklama"
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>İçerik</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-2">
              <ContentEditor
                id="article-content"
                value={values.content}
                onChange={(content) => update("content", content)}
                invalid={Boolean(errors.content)}
                describedBy={errors.content ? "article-content-error" : undefined}
              />
              {errors.content ? (
                <p id="article-content-error" className="text-sm text-red-600">
                  {errors.content}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Field
                id="article-keywords"
                label="Anahtar kelimeler"
                error={errors.keywords}
                hint="Enter veya virgül ile ekleyin. 3–8 anahtar kelime genellikle yeterlidir."
              >
                <KeywordInput
                  id="article-keywords"
                  value={values.keywords}
                  onChange={(keywords) => update("keywords", keywords)}
                  describedBy="article-keywords-hint"
                />
              </Field>
            </CardBody>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Yayın</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-5">
              <fieldset>
                <legend className="text-sm font-medium text-navy-950">Durum</legend>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                  {(
                    [
                      ["draft", "Taslak"],
                      ["published", "Yayında"],
                    ] as const
                  ).map(([status, label]) => (
                    <label
                      key={status}
                      className={cn(
                        "cursor-pointer rounded-md px-3 py-2 text-center text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-gold-500",
                        values.status === status ? "bg-white text-navy-950 shadow-xs" : "text-slate-600 hover:text-navy-950",
                      )}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={values.status === status}
                        onChange={() => update("status", status)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {values.status === "draft"
                    ? "Taslaklar public sitede listelenmez."
                    : "Yayındaki makaleler /makalelerim sayfasında listelenir."}
                </p>
              </fieldset>

              <Field
                id="article-reading"
                label="Okuma süresi (dakika)"
                error={errors.readingMinutes}
                hint={values.readingMinutes === null ? `Boş bırakılırsa içerikten hesaplanır (~${autoMinutes} dk).` : undefined}
              >
                <Input
                  {...fieldAria("article-reading", errors.readingMinutes, values.readingMinutes === null)}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={120}
                  value={values.readingMinutes ?? ""}
                  placeholder={String(autoMinutes)}
                  onChange={(event) => update("readingMinutes", event.target.value === "" ? null : Number(event.target.value))}
                />
              </Field>

              <div className="grid gap-2 border-t border-slate-100 pt-5">
                <Button type="submit" disabled={submitting}>
                  {submitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
                  {submitLabel}
                </Button>
                {onDelete ? (
                  <Button variant="danger-ghost" onClick={onDelete} disabled={submitting}>
                    <Trash2 aria-hidden="true" />
                    Makaleyi sil
                  </Button>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kategori</CardTitle>
            </CardHeader>
            <CardBody>
              <Field id="article-category" label="Kategori" error={errors.categoryId} className="[&>div:first-child]:sr-only">
                <Select
                  {...fieldAria("article-category", errors.categoryId)}
                  value={values.categoryId ?? ""}
                  onChange={(event) => update("categoryId", event.target.value || null)}
                >
                  <option value="">— Kategori seçin —</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Link href="/admin/kategoriler" className="mt-3 inline-block text-xs font-medium text-navy-700 hover:underline">
                Kategorileri yönet
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kapak görseli</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-4">
              <CoverImagePicker
                value={values.coverImage}
                onChange={handleCover}
                urlError={errors["coverImage.url"]}
                previewCaption="Makale kartlarında bu şekilde görünür; makale sayfasında fotoğrafın tamamı gösterilir."
              />
              {errors["coverImage.url"] ? <p className="-mt-2 text-sm text-red-600">{errors["coverImage.url"]}</p> : null}
              <Field
                id="article-cover-alt"
                label="Alternatif metin (alt)"
                error={errors["coverImage.alt"]}
                hint="Erişilebilirlik ve SEO için görseli anlatan kısa bir açıklama."
              >
                <Input
                  {...fieldAria("article-cover-alt", errors["coverImage.alt"], true)}
                  value={values.coverImage.alt}
                  onChange={(event) => handleCover({ ...values.coverImage, alt: event.target.value })}
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Arama motoru önizlemesi</CardTitle>
            </CardHeader>
            <CardBody>
              <SeoPreview title={values.title} slug={values.slug} summary={values.summary} />
            </CardBody>
          </Card>
        </div>
      </form>

      <ArticlePreviewDialog
        openedAt={previewOpenedAt}
        onClose={() => setPreviewOpenedAt(null)}
        values={values}
        categories={categories}
        publishedAt={article?.publishedAt ?? null}
      />
    </>
  );
}
