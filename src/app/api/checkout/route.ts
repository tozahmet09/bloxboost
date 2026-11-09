import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { CREDIT_PACKS, FEATURED_OPTIONS } from "@/lib/money";
import { markPaid, paymentsMode, stripe } from "@/lib/payments";

// Form fields: kind=CREDITS&pack=<id>  or  kind=FEATURED&gameId=<id>&days=<n>
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);
  const mode = paymentsMode();
  const f = await req.formData();
  const kind = String(f.get("kind"));

  let item: { amountCents: number; credits?: number; gameId?: string; days?: number; name: string; back: string };
  if (kind === "CREDITS") {
    const pack = CREDIT_PACKS.find((p) => p.id === f.get("pack"));
    if (!pack) return NextResponse.json({ error: "bad pack" }, { status: 400 });
    item = { amountCents: pack.cents, credits: pack.credits, name: `${pack.credits} player credits`, back: "/dashboard/billing" };
  } else if (kind === "FEATURED") {
    const opt = FEATURED_OPTIONS.find((o) => o.days === Number(f.get("days")));
    const game = await db.game.findFirst({ where: { id: String(f.get("gameId")), ownerId: user.id } });
    if (!opt || !game || game.hiddenAt) return NextResponse.json({ error: "bad option" }, { status: 400 });
    // Featured slots are trailer-first, so a game needs a trailer before it can be featured.
    if (!game.trailerUrl) return NextResponse.redirect(new URL(`/dashboard/games/${game.id}?needTrailer=1`, req.url), 303);
    item = {
      amountCents: opt.cents,
      gameId: game.id,
      days: opt.days,
      name: `Featured: ${game.name} (${opt.days} day${opt.days > 1 ? "s" : ""})`,
      back: `/dashboard/games/${game.id}`,
    };
  } else {
    return NextResponse.json({ error: "bad kind" }, { status: 400 });
  }

  // Live site without a Stripe key: refuse instead of handing out free credits.
  if (mode === "off") return NextResponse.redirect(new URL(`${item.back}?payments=off`, req.url), 303);

  const p = await db.payment.create({
    data: {
      userId: user.id,
      kind,
      amountCents: item.amountCents,
      credits: item.credits ?? 0,
      gameId: item.gameId,
      days: item.days ?? 0,
      provider: mode === "stripe" ? "stripe" : "test",
    },
  });

  if (mode === "test" || !stripe) {
    // Local test mode: no payment provider configured, deliver immediately.
    await markPaid(p.id);
    return NextResponse.redirect(new URL(`${item.back}?paid=1`, req.url), 303);
  }

  const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
  const back = `${appUrl}${item.back}`;
  const sep = item.back.includes("?") ? "&" : "?";
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: user.email,
      client_reference_id: user.id,
      submit_type: "pay",
      line_items: [
        { quantity: 1, price_data: { currency: "usd", unit_amount: item.amountCents, product_data: { name: item.name } } },
      ],
      metadata: { paymentId: p.id, userId: user.id, kind },
      // Copy the ids onto the PaymentIntent too, so refunds and disputes in the Dashboard show what was bought.
      payment_intent_data: { metadata: { paymentId: p.id, userId: user.id, kind } },
      // The success page re-checks this session with Stripe, so credits show up even before the webhook lands.
      success_url: `${back}${sep}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: back,
      // Unpaid checkouts close after an hour instead of the default 24h.
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
    // If this request is retried, Stripe returns the same session instead of making a second one.
    { idempotencyKey: `checkout-${p.id}` },
  );
  await db.payment.update({ where: { id: p.id }, data: { externalId: session.id } });
  return NextResponse.redirect(session.url!, 303);
}
