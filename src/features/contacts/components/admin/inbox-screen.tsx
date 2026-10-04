"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Inbox, Mail, MailOpen, Phone, Reply, Search, Trash2 } from "lucide-react";
import { AdminPageHeader, EmptyState, MessageStatusBadge } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/action-result";
import { formatDateTime, formatShortDate } from "@/lib/format";
import { normalizeForSearch } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { ContactMessage, ContactMessageStatus } from "@/types";
import { useContactsAdmin } from "../../hooks/use-contacts-admin";

type InboxFilter = "inbox" | "unread" | "archived";

const FILTERS: Array<{ value: InboxFilter; label: string }> = [
  { value: "inbox", label: "Gelen kutusu" },
  { value: "unread", label: "Okunmamış" },
  { value: "archived", label: "Arşiv" },
];

function matchesFilter(message: ContactMessage, filter: InboxFilter) {
  if (filter === "archived") return message.status === "archived";
  if (filter === "unread") return message.status === "unread";
  return message.status !== "archived";
}

export function InboxScreen({ initialMessageId }: { initialMessageId?: string }) {
  const { notify } = useToast();
  const { messages, setStatus, removeMessage } = useContactsAdmin();
  const initialMessage = messages.find((message) => message.id === initialMessageId);

  const [filter, setFilter] = useState<InboxFilter>(initialMessage?.status === "archived" ? "archived" : "inbox");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialMessage?.id ?? null);
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  /** Durum değişikliği sunucuda yapılır; başarısız olursa avukat bilgilendirilir. */
  async function changeStatus(message: ContactMessage, status: ContactMessageStatus) {
    try {
      await setStatus(message, status);
    } catch (error) {
      notify({ tone: "error", title: "Mesaj güncellenemedi", description: errorMessage(error) });
    }
  }

  // Panoda tıklanarak gelinen mesaj açılışta okundu olarak işaretlenir (bir kez).
  const initialHandled = useRef(false);
  useEffect(() => {
    if (initialHandled.current || !initialMessage) return;
    initialHandled.current = true;
    if (initialMessage.status === "unread") void changeStatus(initialMessage, "read");
  });

  const needle = normalizeForSearch(query.trim());
  const visible = messages
    .filter((message) => matchesFilter(message, filter))
    .filter(
      (message) =>
        !needle ||
        normalizeForSearch(
          [message.name, message.email ?? "", message.phone ?? "", message.subject, message.message].join(" "),
        ).includes(needle),
    );
  const selected = messages.find((message) => message.id === selectedId) ?? null;
  const counts: Record<InboxFilter, number> = {
    inbox: messages.filter((message) => matchesFilter(message, "inbox")).length,
    unread: messages.filter((message) => matchesFilter(message, "unread")).length,
    archived: messages.filter((message) => matchesFilter(message, "archived")).length,
  };

  function openMessage(message: ContactMessage) {
    setSelectedId(message.id);
    if (message.status === "unread") void changeStatus(message, "read");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeMessage(pendingDelete.id);
      notify({ tone: "success", title: "Mesaj silindi" });
      if (selectedId === pendingDelete.id) setSelectedId(null);
      setPendingDelete(null);
    } catch (error) {
      notify({ tone: "error", title: "Mesaj silinemedi", description: errorMessage(error) });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="İletişim Mesajları"
        description="Web sitesindeki iletişim formundan gelen mesajlar."
      />

      <Card className="overflow-hidden lg:grid lg:min-h-[36rem] lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className={cn("border-navy-900/[0.07] lg:border-r", selected && "hidden lg:block")}>
          <div className="grid gap-3 border-b border-navy-900/[0.07] p-4">
            <div role="group" aria-label="Mesaj filtresi" className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={filter === item.value}
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                    filter === item.value ? "bg-white text-navy-950 shadow-xs" : "text-slate-600 hover:text-navy-950",
                  )}
                >
                  {item.label}
                  <span className="ml-1 text-xs text-slate-500 tabular-nums">{counts[item.value]}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <label htmlFor="inbox-search" className="sr-only">
                Mesajlarda ara
              </label>
              <Input
                id="inbox-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ad, e-posta, telefon veya konu"
                className="h-10 pl-9 text-sm"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<Inbox />}
              title={query ? "Aramaya uygun mesaj yok" : filter === "archived" ? "Arşiv boş" : "Mesaj yok"}
            />
          ) : (
            <ul className="divide-y divide-navy-900/[0.06]">
              {visible.map((message) => {
                const unread = message.status === "unread";
                const active = message.id === selectedId;
                return (
                  <li key={message.id}>
                    <button
                      type="button"
                      onClick={() => openMessage(message)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3.5 text-left transition-colors",
                        active ? "bg-navy-50" : "hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread ? "bg-gold-500" : "bg-transparent")}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-sm", unread ? "font-semibold text-navy-950" : "font-medium text-slate-700")}>
                            {message.name}
                            {unread ? <span className="sr-only"> (okunmadı)</span> : null}
                          </span>
                          <time dateTime={message.createdAt} className="shrink-0 text-xs text-slate-600">
                            {formatShortDate(message.createdAt)}
                          </time>
                        </span>
                        <span className={cn("mt-0.5 block truncate text-sm", unread ? "text-navy-950" : "text-slate-600")}>
                          {message.subject}
                        </span>
                        <span className="mt-0.5 line-clamp-1 text-xs text-slate-600">{message.message}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={cn(!selected && "hidden lg:block")}>
          {selected ? (
            <MessageDetail
              key={selected.id}
              message={selected}
              onBack={() => setSelectedId(null)}
              onStatus={(status) => void changeStatus(selected, status)}
              onDelete={() => setPendingDelete(selected)}
            />
          ) : (
            <EmptyState
              icon={<MailOpen />}
              title="Bir mesaj seçin"
              description="Mesajın tamamını ve iletişim bilgilerini görmek için listeden seçim yapın."
              className="h-full justify-center"
            />
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Mesaj silinsin mi?"
        description={pendingDelete ? `${pendingDelete.name} tarafından gönderilen “${pendingDelete.subject}” mesajı kalıcı olarak silinecek.` : undefined}
        pending={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function MessageDetail({
  message,
  onBack,
  onStatus,
  onDelete,
}: {
  message: ContactMessage;
  onBack: () => void;
  onStatus: (status: ContactMessage["status"]) => void;
  onDelete: () => void;
}) {
  const archived = message.status === "archived";

  return (
    <article aria-labelledby="mesaj-konu" className="flex h-full flex-col motion-safe:animate-fade-in">
      <header className="border-b border-navy-900/[0.07] p-5 sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900 lg:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Mesajlara dön
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 id="mesaj-konu" className="text-lg font-semibold text-balance text-navy-950">
            {message.subject}
          </h2>
          <MessageStatusBadge status={message.status} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-navy-950">{message.name}</span> ·{" "}
          <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
        </p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="sr-only">E-posta</dt>
            <dd className="flex min-w-0 items-center gap-2">
              <Mail className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              {message.email ? (
                <a href={`mailto:${message.email}`} className="truncate text-navy-700 hover:underline">
                  {message.email}
                </a>
              ) : (
                <span className="text-slate-500">E-posta belirtilmedi</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Telefon</dt>
            <dd className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              {message.phone ? (
                <a href={`tel:${message.phone.replace(/[^\d+]/g, "")}`} className="text-navy-700 hover:underline">
                  {message.phone}
                </a>
              ) : (
                <span className="text-slate-500">Telefon belirtilmedi</span>
              )}
            </dd>
          </div>
        </dl>
      </header>

      <div className="flex-1 p-5 text-[15px] leading-relaxed whitespace-pre-line text-slate-700 sm:p-6">{message.message}</div>

      <footer className="flex flex-wrap gap-2 border-t border-navy-900/[0.07] bg-slate-50/60 p-4">
        {message.email ? (
          <ButtonLink href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`} size="sm">
            <Reply aria-hidden="true" />
            E-posta ile yanıtla
          </ButtonLink>
        ) : null}
        {message.phone ? (
          <ButtonLink href={`tel:${message.phone.replace(/[^\d+]/g, "")}`} variant="outline" size="sm">
            <Phone aria-hidden="true" />
            Ara
          </ButtonLink>
        ) : null}
        {!archived ? (
          <Button variant="ghost" size="sm" onClick={() => onStatus(message.status === "unread" ? "read" : "unread")}>
            {message.status === "unread" ? <MailOpen aria-hidden="true" /> : <Mail aria-hidden="true" />}
            {message.status === "unread" ? "Okundu işaretle" : "Okunmadı işaretle"}
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={() => onStatus(archived ? "read" : "archived")}>
          {archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
          {archived ? "Arşivden çıkar" : "Arşivle"}
        </Button>
        <Button variant="danger-ghost" size="sm" onClick={onDelete} className="sm:ml-auto">
          <Trash2 aria-hidden="true" />
          Sil
        </Button>
      </footer>
    </article>
  );
}
