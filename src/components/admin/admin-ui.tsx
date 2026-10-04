import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ArticleStatus, ContactMessageStatus } from "@/types";

interface AdminPageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}

export function AdminPageHeader({ title, description, actions, back }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-navy-900"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-navy-950 sm:text-[1.75rem]">{title}</h1>
        {description ? <p className="mt-1.5 text-[15px] text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      {icon ? (
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-navy-50 text-navy-600 [&_svg]:size-6">
          {icon}
        </span>
      ) : null}
      <p className="mt-4 font-semibold text-navy-950">{title}</p>
      {description ? <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

const articleStatus: Record<ArticleStatus, { label: string; tone: "success" | "warning" }> = {
  published: { label: "Yayında", tone: "success" },
  draft: { label: "Taslak", tone: "warning" },
};

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  const { label, tone } = articleStatus[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const messageStatus: Record<ContactMessageStatus, { label: string; tone: "gold" | "neutral" | "outline" }> = {
  unread: { label: "Okunmadı", tone: "gold" },
  read: { label: "Okundu", tone: "neutral" },
  archived: { label: "Arşivde", tone: "outline" },
};

export function MessageStatusBadge({ status }: { status: ContactMessageStatus }) {
  const { label, tone } = messageStatus[status];
  return <Badge tone={tone}>{label}</Badge>;
}
