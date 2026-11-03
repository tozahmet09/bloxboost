import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmt, TOPUP_OPTIONS_CENTS } from "@/lib/money";
import { stripe } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function Billing({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const user = await requireUser();
  const { ok } = await searchParams;
  const payments = await db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Add ad credit</h1>
        <p className="mt-1 text-sm text-slate-400">Current balance: {fmt(user.creditCents)}</p>
        {ok && <p className="mt-3 rounded-lg bg-brand/10 p-2 text-sm text-brand">Payment received. Thanks!</p>}
        {!stripe && (
          <p className="mt-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-300">
            Test mode: no payment provider is configured, so credit is added instantly for free.
          </p>
        )}
        <form action="/api/checkout" method="post" className="mt-6 grid grid-cols-2 gap-3">
          {TOPUP_OPTIONS_CENTS.map((c) => (
            <button key={c} name="amount" value={c} className="btn-ghost py-4 text-lg font-bold">
              {fmt(c)}
            </button>
          ))}
        </form>
      </div>
      {payments.length > 0 && (
        <div className="card p-4 text-sm">
          <h2 className="mb-2 font-semibold">History</h2>
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between border-t border-slate-800 py-2">
              <span>{p.createdAt.toISOString().slice(0, 10)}</span>
              <span>{fmt(p.amountCents)}</span>
              <span className={p.status === "PAID" ? "text-brand" : "text-slate-500"}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
