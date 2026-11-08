import { Ticket } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CREDIT_PACKS, fmt } from "@/lib/money";
import { checkoutNotice, paymentsMode, stripeTestKey } from "@/lib/payments";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Not completed",
  REFUNDED: "Refunded",
  DISPUTED: "Disputed",
};

export default async function Billing({ searchParams }: { searchParams: Promise<{ paid?: string; session_id?: string; payments?: string }> }) {
  const sessionUser = await requireUser();
  // Runs before reading the user/payments so a just-paid purchase is already counted below.
  const notice = await checkoutNotice(await searchParams, sessionUser.id);
  const mode = paymentsMode();
  const user = (await db.user.findUnique({ where: { id: sessionUser.id } })) ?? sessionUser;
  const payments = await db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20, include: { game: true } });
  const best = CREDIT_PACKS[CREDIT_PACKS.length - 1].id;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="eyebrow">Credits</p>
        <h1 className="mt-1 page-title">1 credit = 1 verified player</h1>
        <p className="mt-2 text-mute">You have <b className="text-cream tabular-nums">{user.credits}</b>. Playing other games earns them for free.</p>
        {notice === "paid" && <p className="mt-3 text-sm text-verified">Payment received. Credits added.</p>}
        {notice === "processing" && <p className="mt-3 text-sm text-mute">Payment is processing. Credits appear here as soon as Stripe confirms it.</p>}
        {(notice === "off" || mode === "off") && <p className="mt-3 text-sm text-mute">Buying credits isn&apos;t open yet. You can still earn them by playing other games.</p>}
        {mode === "test" && <p className="mt-3 text-xs text-mute">Test mode: purchases are free and instant.</p>}
        {mode === "stripe" && stripeTestKey && <p className="mt-3 text-xs text-mute">Stripe test mode: pay with card 4242 4242 4242 4242, any future date, any CVC.</p>}
      </div>

      <form action="/api/checkout" method="post" className="grid gap-3 sm:grid-cols-3">
        <input type="hidden" name="kind" value="CREDITS" />
        {CREDIT_PACKS.map((p) => (
          <button
            key={p.id}
            name="pack"
            value={p.id}
            className={`group relative rounded-media border p-5 text-left transition active:scale-[.98] ${p.id === best ? "border-marquee/60" : "border-line hover:border-mute"}`}
          >
            {p.id === best && <span className="chip absolute right-3 top-3 bg-marquee text-ink">Best value</span>}
            <Ticket className="h-5 w-5 text-marquee" />
            <div className="mt-3 font-display text-3xl font-bold tabular-nums">{p.credits}</div>
            <div className="text-sm text-mute">players</div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-lg font-semibold">{fmt(p.cents)}</span>
              <span className="text-xs text-mute tabular-nums">{(p.cents / p.credits).toFixed(1)}¢ each</span>
            </div>
          </button>
        ))}
      </form>

      {payments.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-bold">History</h2>
          <ul className="divide-y divide-line border-y border-line text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="w-24 text-mute tabular-nums">{p.createdAt.toISOString().slice(0, 10)}</span>
                <span className="min-w-0 flex-1 truncate">{p.kind === "CREDITS" ? `${p.credits} credits` : `Spotlight ${p.days}d · ${p.game?.name ?? ""}`}</span>
                <span className="tabular-nums">{fmt(p.amountCents)}</span>
                <span className={p.status === "PAID" ? "text-verified" : "text-mute"}>{STATUS_LABEL[p.status] ?? p.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
