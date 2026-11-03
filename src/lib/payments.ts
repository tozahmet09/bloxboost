import "server-only";
import Stripe from "stripe";
import { db } from "./db";

export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/** Marks a payment paid and delivers what was bought. Safe to call more than once. */
export async function markPaid(paymentId: string) {
  await db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.status === "PAID") return;
    await tx.payment.update({ where: { id: p.id }, data: { status: "PAID" } });
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
