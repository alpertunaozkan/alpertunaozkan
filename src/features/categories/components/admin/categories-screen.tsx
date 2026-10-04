"use client";

import { useState, type FormEvent } from "react";
import { Check, FolderTree, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminPageHeader, EmptyState } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, fieldAria } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { ActionError, errorMessage } from "@/lib/action-result";
import { formatShortDate } from "@/lib/format";
import { slugify } from "@/lib/slugify";
import { useCategoriesAdmin, type CategoryWithUsage } from "../../hooks/use-categories-admin";
import { categoryFormSchema } from "../../schema";

export function CategoriesScreen() {
  const { notify } = useToast();
  const { categories, saveCategory, removeCategory } = useCategoriesAdmin();

  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState<string>();
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string>();
  const [savingEdit, setSavingEdit] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<CategoryWithUsage | null>(null);
  const [deleting, setDeleting] = useState(false);

  function validate(name: string, excludeId?: string): { name?: string; error?: string } {
    const parsed = categoryFormSchema.safeParse({ name });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const normalized = parsed.data.name.toLocaleLowerCase("tr-TR");
    const duplicate = categories.some(
      (category) => category.id !== excludeId && category.name.toLocaleLowerCase("tr-TR") === normalized,
    );
    return duplicate ? { error: "Bu isimde bir kategori zaten var" } : { name: parsed.data.name };
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validate(newName);
    if (!result.name) {
      setNewError(result.error);
      return;
    }
    setAdding(true);
    try {
      await saveCategory({ name: result.name });
      setNewName("");
      notify({ tone: "success", title: "Kategori eklendi" });
    } catch (error) {
      setNewError(error instanceof ActionError ? (error.fieldErrors?.name ?? error.message) : errorMessage(error));
    } finally {
      setAdding(false);
    }
  }

  function startEditing(category: CategoryWithUsage) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditError(undefined);
  }

  async function handleUpdate(category: CategoryWithUsage) {
    const result = validate(editName, category.id);
    if (!result.name) {
      setEditError(result.error);
      return;
    }
    setSavingEdit(true);
    try {
      await saveCategory({ name: result.name }, category);
      setEditingId(null);
      notify({ tone: "success", title: "Kategori güncellendi" });
    } catch (error) {
      setEditError(error instanceof ActionError ? (error.fieldErrors?.name ?? error.message) : errorMessage(error));
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeCategory(pendingDelete.id);
      notify({ tone: "success", title: "Kategori silindi" });
      setPendingDelete(null);
    } catch (error) {
      notify({ tone: "error", title: "Kategori silinemedi", description: errorMessage(error) });
    } finally {
      setDeleting(false);
    }
  }

  const deleteImpact = pendingDelete ? pendingDelete.articleCount + pendingDelete.videoCount : 0;

  return (
    <>
      <AdminPageHeader title="Kategoriler" description="Makale ve videoları gruplamak için kullanılan kategoriler." />

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4 lg:self-start">
          <CardHeader>
            <CardTitle>Yeni kategori</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreate} noValidate className="grid gap-4">
              <Field
                id="category-new"
                label="Kategori adı"
                error={newError}
                hint={newName.trim() ? `Kısa ad: ${slugify(newName) || "—"}` : "örn. Miras Hukuku"}
              >
                <Input
                  {...fieldAria("category-new", newError, true)}
                  value={newName}
                  onChange={(event) => {
                    setNewName(event.target.value);
                    setNewError(undefined);
                  }}
                  maxLength={60}
                />
              </Field>
              <Button type="submit" disabled={adding}>
                {adding ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
                Kategori ekle
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Tüm kategoriler</CardTitle>
            <span className="text-sm text-slate-500">{categories.length} kategori</span>
          </CardHeader>
          {categories.length === 0 ? (
            <EmptyState icon={<FolderTree />} title="Henüz kategori yok" description="Soldaki formdan ilk kategoriyi ekleyin." />
          ) : (
            <ul className="divide-y divide-navy-900/[0.06]">
              {categories.map((category) => (
                <li key={category.id} className="px-5 py-4">
                  {editingId === category.id ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleUpdate(category);
                      }}
                      noValidate
                      className="flex flex-col gap-2 sm:flex-row sm:items-start"
                    >
                      <div className="flex-1">
                        <label htmlFor={`category-edit-${category.id}`} className="sr-only">
                          Kategori adı
                        </label>
                        <Input
                          {...fieldAria(`category-edit-${category.id}`, editError)}
                          value={editName}
                          onChange={(event) => {
                            setEditName(event.target.value);
                            setEditError(undefined);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setEditingId(null);
                          }}
                          maxLength={60}
                          autoFocus
                          className="h-10"
                        />
                        {editError ? (
                          <p id={`category-edit-${category.id}-error`} className="mt-1.5 text-sm text-red-600">
                            {editError}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-1">
                        <Button type="submit" size="sm" disabled={savingEdit}>
                          {savingEdit ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                          Kaydet
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} disabled={savingEdit}>
                          <X aria-hidden="true" />
                          Vazgeç
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-navy-950">{category.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {category.slug} · Güncelleme: {formatShortDate(category.updatedAt)}
                        </p>
                      </div>
                      <dl className="flex gap-4 text-sm">
                        <div className="flex items-baseline gap-1.5">
                          <dt className="text-slate-500">Makale</dt>
                          <dd className="font-semibold text-navy-950 tabular-nums">{category.articleCount}</dd>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <dt className="text-slate-500">Video</dt>
                          <dd className="font-semibold text-navy-950 tabular-nums">{category.videoCount}</dd>
                        </div>
                      </dl>
                      <div className="flex gap-1 sm:ml-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => startEditing(category)}
                          aria-label={`${category.name} — düzenle`}
                          title="Düzenle"
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          variant="danger-ghost"
                          size="icon-sm"
                          onClick={() => setPendingDelete(category)}
                          aria-label={`${category.name} — sil`}
                          title="Sil"
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Kategori silinsin mi?"
        description={
          pendingDelete
            ? deleteImpact > 0
              ? `“${pendingDelete.name}” kategorisinde ${pendingDelete.articleCount} makale ve ${pendingDelete.videoCount} video var. Silindiğinde bu içerikler kategorisiz kalır.`
              : `“${pendingDelete.name}” kategorisi kalıcı olarak silinecek.`
            : undefined
        }
        pending={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
