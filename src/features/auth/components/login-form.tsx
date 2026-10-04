"use client";

import { useActionState, useState } from "react";
import { CircleAlert, Eye, EyeOff, LoaderCircle, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldAria } from "@/components/ui/form-controls";
import { login } from "../actions";
import { initialLoginState } from "../login";

/** `next`: girişten sonra dönülecek panel sayfası (sunucuda doğrulanır). */
export function LoginForm({ next }: { next?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(login, initialLoginState);

  return (
    <form action={formAction} noValidate className="grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 motion-safe:animate-fade-in"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}

      <Field id="login-username" label="Kullanıcı adı" error={state.fieldErrors.username}>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            {...fieldAria("login-username", state.fieldErrors.username)}
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={state.username}
            className="pl-10"
          />
        </div>
      </Field>

      <Field id="login-password" label="Şifre" error={state.fieldErrors.password}>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            {...fieldAria("login-password", state.fieldErrors.password)}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-11 pl-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-navy-900"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Giriş yapılıyor…
          </>
        ) : (
          "Giriş yap"
        )}
      </Button>
    </form>
  );
}
