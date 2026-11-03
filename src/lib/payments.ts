import "server-only";
import Stripe from "stripe";
import { db } from "./db";

export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/** Marks a payment as paid and adds the credit. Safe to call twice. */
export async function markPaid(paymentId: string) {
  await db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.status === "PAID") return;
    await tx.payment.update({ where: { id: p.id }, data: { status: "PAID" } });
    await tx.user.update({ where: { id: p.userId }, data: { creditCents: { increment: p.amountCents } } });
  });
}
