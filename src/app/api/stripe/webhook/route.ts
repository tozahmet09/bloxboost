import { NextRequest, NextResponse } from "next/server";
import { markPaid, stripe } from "@/lib/payments";

export async function POST(req: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ ok: false }, { status: 400 });
  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    if (s.payment_status === "paid" && s.metadata?.paymentId) await markPaid(s.metadata.paymentId);
  }
  return NextResponse.json({ received: true });
}
