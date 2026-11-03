import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { CREDIT_PACKS, FEATURED_OPTIONS } from "@/lib/money";
import { markPaid, stripe } from "@/lib/payments";

// Form fields: kind=CREDITS&pack=<id>  or  kind=FEATURED&gameId=<id>&days=<n>
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);
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
    if (!opt || !game) return NextResponse.json({ error: "bad option" }, { status: 400 });
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

  const p = await db.payment.create({
    data: {
      userId: user.id,
      kind,
      amountCents: item.amountCents,
      credits: item.credits ?? 0,
      gameId: item.gameId,
      days: item.days ?? 0,
      provider: stripe ? "stripe" : "test",
    },
  });

  if (!stripe) {
    // Test mode: no payment provider configured, deliver immediately.
    await markPaid(p.id);
    return NextResponse.redirect(new URL(`${item.back}?paid=1`, req.url), 303);
  }

  const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      { quantity: 1, price_data: { currency: "usd", unit_amount: item.amountCents, product_data: { name: item.name } } },
    ],
    metadata: { paymentId: p.id },
    success_url: `${appUrl}${item.back}?paid=1`,
    cancel_url: `${appUrl}${item.back}`,
  });
  await db.payment.update({ where: { id: p.id }, data: { externalId: session.id } });
  return NextResponse.redirect(session.url!, 303);
}
