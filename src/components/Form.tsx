"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "@/app/actions";
import { Burst } from "./Burst";

export function Form({
  action,
  children,
  submit,
  className = "space-y-4",
  buttonClass = "btn w-full",
  celebrate,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  children?: React.ReactNode;
  submit: React.ReactNode;
  className?: string;
  buttonClass?: string;
  /** Show a reward burst instead of a plain message when the action succeeds. */
  celebrate?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  if (celebrate && state?.ok) return <Burst label={state.ok} />;
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
      {state?.error && <p className="basis-full text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="basis-full text-sm text-verified">{state.ok}</p>}
      <button className={buttonClass} disabled={pending}>
        {pending ? "Working…" : submit}
      </button>
    </form>
  );
}
