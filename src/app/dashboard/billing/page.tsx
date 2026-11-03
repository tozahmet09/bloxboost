import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CREDIT_PACKS, fmt } from "@/lib/money";
import { stripe } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function Billing({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const user = await requireUser();
  const { paid } = await searchParams;
  const payments = await db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20, include: { game: true } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Buy player credits</h1>
        <p className="mt-1 text-sm text-slate-400">You have ⭐ {user.credits}. 1 credit = 1 player who plays your game for 10+ minutes and leaves feedback.</p>
        {paid && <p className="mt-3 rounded-lg bg-brand/10 p-2 text-sm text-brand">Payment received. Credits added!</p>}
        {!stripe && (
          <p className="mt-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-300">
            Test mode: no payment provider is set up, so purchases are free and instant.
          </p>
        )}
        <form action="/api/checkout" method="post" className="mt-6 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="kind" value="CREDITS" />
          {CREDIT_PACKS.map((p) => (
            <button key={p.id} name="pack" value={p.id} className="card p-5 text-left hover:border-brand">
              <div className="text-sm text-slate-400">{p.label}</div>
              <div className="text-2xl font-extrabold">{p.credits} players</div>
              <div className="mt-2 font-semibold text-brand">{fmt(p.cents)}</div>
              <div className="text-xs text-slate-500">{((p.cents / p.credits)).toFixed(1)}¢ per player</div>
            </button>
          ))}
        </form>
      </div>
      {payments.length > 0 && (
        <div className="card p-4 text-sm">
          <h2 className="mb-2 font-semibold">History</h2>
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between gap-2 border-t border-slate-800 py-2">
              <span>{p.createdAt.toISOString().slice(0, 10)}</span>
              <span className="flex-1 truncate text-slate-400">
                {p.kind === "CREDITS" ? `${p.credits} credits` : `Featured ${p.days}d · ${p.game?.name ?? ""}`}
              </span>
              <span>{fmt(p.amountCents)}</span>
              <span className={p.status === "PAID" ? "text-brand" : "text-slate-500"}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
