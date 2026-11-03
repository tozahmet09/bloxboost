"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "@/app/actions";

export function Form({
  action,
  children,
  submit,
  className = "space-y-4",
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  children?: React.ReactNode;
  submit: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form
      action={formAction}
      // Submit manually so React doesn't clear the inputs when the server returns an error.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className={className}
    >
      {children}
      {state?.error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-brand/10 p-2 text-sm text-brand">{state.ok}</p>}
      <button className="btn w-full" disabled={pending}>
        {pending ? "…" : submit}
      </button>
    </form>
  );
}
