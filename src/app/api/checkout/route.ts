import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { TOPUP_OPTIONS_CENTS } from "@/lib/money";
import { markPaid, stripe } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);
  const amount = Number((await req.formData()).get("amount"));
  if (!TOPUP_OPTIONS_CENTS.includes(amount)) return NextResponse.json({ error: "bad amount" }, { status: 400 });

  const appUrl = process.env.APP_URL ?? new URL(req.url).origin;

  if (!stripe) {
    const p = await db.payment.create({ data: { userId: user.id, amountCents: amount, provider: "test" } });
    await markPaid(p.id);
    return NextResponse.redirect(new URL("/dashboard/billing?ok=1", req.url), 303);
  }

  const p = await db.payment.create({ data: { userId: user.id, amountCents: amount, provider: "stripe" } });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: { currency: "usd", unit_amount: amount, product_data: { name: "BloxBoost ad credit" } },
      },
    ],
    metadata: { paymentId: p.id },
    success_url: `${appUrl}/dashboard/billing?ok=1`,
    cancel_url: `${appUrl}/dashboard/billing`,
  });
  await db.payment.update({ where: { id: p.id }, data: { externalId: session.id } });
  return NextResponse.redirect(session.url!, 303);
}
