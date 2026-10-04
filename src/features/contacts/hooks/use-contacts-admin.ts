"use client";

import { useAdminData } from "@/features/admin/admin-data-provider";
import { unwrapAction } from "@/lib/action-result";
import type { ContactMessage, ContactMessageStatus } from "@/types";
import { deleteContactMessageAction, setContactStatusAction } from "../actions";

/**
 * Panel ekranlarının iletişim mesajlarına ve işlemlerine eriştiği tek nokta.
 * İşlemler sunucuda yapılır; başarısızlıkta ActionError fırlatır.
 */
export function useContactsAdmin() {
  const { data, dispatch } = useAdminData();

  const messages = [...data.contacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function setStatus(message: ContactMessage, status: ContactMessageStatus): Promise<void> {
    if (message.status === status) return;
    const contact = unwrapAction(await setContactStatusAction(message.id, status));
    dispatch({ type: "contact/saved", contact });
  }

  async function removeMessage(id: string): Promise<void> {
    unwrapAction(await deleteContactMessageAction(id));
    dispatch({ type: "contact/removed", id });
  }

  return {
    messages,
    unreadCount: messages.filter((message) => message.status === "unread").length,
    setStatus,
    removeMessage,
  };
}
