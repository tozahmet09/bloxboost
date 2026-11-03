import "server-only";
import Stripe from "stripe";
import { db } from "./db";

export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * How purchases are handled:
 * - "stripe": real Stripe Checkout (test or live, depending on the key).
 * - "test":   free, instant purchases. Only on local dev, or when ALLOW_FREE_TEST_PAYMENTS=1.
 * - "off":    production without a Stripe key. Purchases are refused so nobody gets credits for free.
 */
export type PaymentsMode = "stripe" | "test" | "off";

export function paymentsMode(): PaymentsMode {
  if (stripe) return "stripe";
  if (process.env.NODE_ENV !== "production" || process.env.ALLOW_FREE_TEST_PAYMENTS === "1") return "test";
  return "off";
}

/** True when the key is a Stripe test key (sk_test_ / rk_test_), so the UI can say no real money moves. */
export const stripeTestKey = /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? "");

/** Marks a payment paid and delivers what was bought. Safe to call more than once. */
export async function markPaid(paymentId: string, paymentIntentId?: string | null) {
  await db.$transaction(async (tx) => {
    // Flip PENDING -> PAID atomically, so two callers (webhook + success page) can't both deliver.
    const flipped = await tx.payment.updateMany({
      where: { id: paymentId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date(), ...(paymentIntentId ? { paymentIntentId } : {}) },
    });
    if (flipped.count === 0) return;
    const p = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (p.kind === "CREDITS") {
      await tx.user.update({ where: { id: p.userId }, data: { credits: { increment: p.credits } } });
    } else if (p.kind === "FEATURED" && p.gameId) {
      const g = await tx.game.findUnique({ where: { id: p.gameId } });
      if (!g) return;
      const start = g.featuredUntil && g.featuredUntil > new Date() ? g.featuredUntil : new Date();
      await tx.game.update({
        where: { id: g.id },
        data: { featuredUntil: new Date(start.getTime() + p.days * 864e5) },
      });
    }
  });
}

/**
 * Checks a Checkout Session with Stripe and delivers it if it is paid.
 * Called by the webhook and by the success page, whichever comes first.
 * Returns the payment's status afterwards, or null if the session isn't ours.
 */
export async function fulfillCheckoutSession(sessionId: string, userId?: string) {
  if (!stripe) return null;
  const p = await db.payment.findUnique({ where: { externalId: sessionId } });
  if (!p || (userId && p.userId !== userId)) return null;
  if (p.status !== "PENDING") return p.status;

  const s = await stripe.checkout.sessions.retrieve(sessionId);
  if (s.metadata?.paymentId !== p.id) return null;
  // "no_payment_required" can only happen with a 100% coupon; we don't create those, so treat it as unpaid.
  if (s.payment_status !== "paid") {
    if (s.status === "expired") await markFailed(p.id);
    return s.status === "expired" ? "FAILED" : "PENDING";
  }
  if (s.amount_total !== p.amountCents || s.currency !== "usd") {
    console.error(`Stripe amount mismatch on payment ${p.id}: got ${s.amount_total} ${s.currency}`);
    return "PENDING";
  }
  const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
  await markPaid(p.id, pi);
  return "PAID";
}

/** An unpaid checkout that expired or whose bank payment failed. Nothing was delivered. */
export async function markFailed(paymentId: string) {
  await db.payment.updateMany({ where: { id: paymentId, status: "PENDING" }, data: { status: "FAILED" } });
}

/**
 * Takes back what a refunded or disputed payment delivered. Safe to call more than once.
 * Credits already spent can't be recovered, so the balance stops at 0.
 */
export async function reversePayment(paymentIntentId: string, status: "REFUNDED" | "DISPUTED") {
  await db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { paymentIntentId } });
    if (!p || p.status !== "PAID") return;
    await tx.payment.update({ where: { id: p.id }, data: { status } });
    if (p.kind === "CREDITS") {
      const u = await tx.user.findUniqueOrThrow({ where: { id: p.userId } });
      await tx.user.update({ where: { id: u.id }, data: { credits: Math.max(0, u.credits - p.credits) } });
    } else if (p.kind === "FEATURED" && p.gameId) {
      const g = await tx.game.findUnique({ where: { id: p.gameId } });
      if (!g?.featuredUntil) return;
      const until = new Date(g.featuredUntil.getTime() - p.days * 864e5);
      await tx.game.update({ where: { id: g.id }, data: { featuredUntil: until > new Date() ? until : null } });
    }
  });
}

/**
 * What to tell the buyer when Stripe sends them back.
 * Checks the session itself, so "Payment received" only shows once the credits are really there.
 */
export async function checkoutNotice(q: { paid?: string; session_id?: string; payments?: string }, userId: string) {
  if (q.payments === "off") return "off" as const;
  if (q.session_id) {
    const status = await fulfillCheckoutSession(q.session_id, userId).catch(() => "PENDING");
    if (status === "PAID") return "paid" as const;
    if (status === "PENDING") return "processing" as const;
    return null;
  }
  return q.paid ? ("paid" as const) : null;
}
