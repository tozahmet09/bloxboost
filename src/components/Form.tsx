"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";

export function Form({
  action,
  children,
  submit,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submit: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state?.error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>
        {pending ? "…" : submit}
      </button>
    </form>
  );
}
