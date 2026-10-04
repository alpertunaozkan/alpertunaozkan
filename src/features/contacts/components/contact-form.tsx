"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, fieldAria } from "@/components/ui/form-controls";
import { CONTACT_HONEYPOT_FIELD, initialContactFormState, type ContactFormField } from "../contact-form-state";
import { submitContactForm } from "../submit-contact";

/** Başarılı gönderimden sonra formu sıfırlamak için bileşen yeniden bağlanır. */
export function ContactForm() {
  const [formKey, setFormKey] = useState(0);
  return <ContactFormInner key={formKey} onReset={() => setFormKey((key) => key + 1)} />;
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(submitContactForm, initialContactFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-center px-6 py-14 text-center motion-safe:animate-fade-up">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <p className="mt-6 max-w-md font-serif text-2xl leading-snug font-semibold text-navy-950">{state.message}</p>
        <Button variant="outline" className="mt-8" onClick={onReset}>
          Yeni mesaj gönder
        </Button>
      </div>
    );
  }

  const error = (field: ContactFormField) => state.fieldErrors[field];

  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-5">
      {/* Bot tuzağı: görünmez ve klavyeyle ulaşılamaz; dolu gelen gönderim kaydedilmez. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`contact-${CONTACT_HONEYPOT_FIELD}`}>Web siteniz</label>
        <input
          id={`contact-${CONTACT_HONEYPOT_FIELD}`}
          name={CONTACT_HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 motion-safe:animate-fade-in"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}

      <Field id="contact-name" label="Adınız Soyadınız" required error={error("name")}>
        <Input
          {...fieldAria("contact-name", error("name"))}
          name="name"
          autoComplete="name"
          defaultValue={state.values.name}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-email" label="E-posta" error={error("email")}>
          <Input
            {...fieldAria("contact-email", error("email"))}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={state.values.email}
          />
        </Field>
        <Field id="contact-phone" label="Telefon" error={error("phone")}>
          <Input
            {...fieldAria("contact-phone", error("phone"))}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="05xx xxx xx xx"
            defaultValue={state.values.phone}
          />
        </Field>
      </div>
      {error("email") || error("phone") ? null : (
        <p className="-mt-2 text-xs text-slate-500">E-posta veya telefon alanlarından en az biri zorunludur.</p>
      )}

      <Field id="contact-subject" label="Konu" required error={error("subject")}>
        <Input
          {...fieldAria("contact-subject", error("subject"))}
          name="subject"
          defaultValue={state.values.subject}
        />
      </Field>

      <Field id="contact-message" label="Mesajınız" required error={error("message")}>
        <Textarea
          {...fieldAria("contact-message", error("message"))}
          name="message"
          rows={6}
          maxLength={2000}
          defaultValue={state.values.message}
          className="resize-y"
        />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Gönderiliyor…
          </>
        ) : (
          <>
            <Send aria-hidden="true" />
            Mesajı Gönder
          </>
        )}
      </Button>
    </form>
  );
}
