# Stripe plan for BloxBoost

What BloxBoost sells, all one-time payments in USD:

| Product | Price | Delivers |
| --- | --- | --- |
| Starter pack | $5 | 50 credits |
| Boost pack | $10 | 120 credits |
| Launch pack | $20 | 300 credits |
| Spotlight 1 / 3 / 7 days | $3 / $7 / $10 | Homepage featured slot (game needs a trailer) |
| Pro (later) | monthly | Subscription, see "Later" below |

No Robux. Prices live in `src/lib/money.ts` and are always set on the server, never taken from the browser.

## How it works

1. **Checkout** (`src/app/api/checkout/route.ts`): creates a `Payment` row (PENDING), then a hosted Stripe Checkout Session in `payment` mode with inline `price_data`. The payment id is put in the session and PaymentIntent metadata. An idempotency key stops a retried request from creating a second session. Unpaid sessions expire after 1 hour.
2. **Fulfilment** (`fulfillCheckoutSession` in `src/lib/payments.ts`): re-reads the session from Stripe, checks it belongs to the payment, is `paid`, and the amount matches, then delivers. It runs from both the webhook and the success page, whichever comes first. Delivery flips PENDING to PAID atomically, so credits can never be added twice.
3. **Webhook** (`src/app/api/stripe/webhook/route.ts`), signature-checked:
   - `checkout.session.completed`, `checkout.session.async_payment_succeeded`: deliver.
   - `checkout.session.expired`, `checkout.session.async_payment_failed`: mark FAILED.
   - `charge.refunded` (full refund), `charge.dispute.created`: take back the credits (down to 0) or the spotlight days.
4. **Safety switch**: on the live site with no `STRIPE_SECRET_KEY`, purchases are refused. Free "test mode" purchases only work in local dev, or if you set `ALLOW_FREE_TEST_PAYMENTS=1` on purpose.

## Set up (test mode first)

1. Create an account at <https://dashboard.stripe.com/register>. Leave it in **Test mode** (toggle top right).
2. *Developers → API keys*: copy the **Secret key** (`sk_test_...`).
3. Vercel → project → *Settings → Environment Variables*: add `STRIPE_SECRET_KEY` = that key. Never paste it in chat or commit it.
4. Stripe → *Developers → Webhooks → Add endpoint*: URL `https://<your-site>/api/stripe/webhook`, select the 6 events listed above. Copy the **Signing secret** (`whsec_...`) into Vercel as `STRIPE_WEBHOOK_SECRET`.
5. Make sure `APP_URL` is your https site URL. Redeploy.
6. Buy a pack with card `4242 4242 4242 4242`, any future date, any CVC. Credits should appear right after the redirect. In Stripe → Webhooks the events should show `200`.

Local testing with the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints a `whsec_` for `.env`.

## Before going live

- Activate the account (business details, bank account) and switch to live keys in Vercel. Live keys start with `sk_live_`.
- Create a second webhook endpoint in live mode; it has its own signing secret.
- Prefer a **restricted key** with only Checkout Sessions (write) and webhook read access.
- Turn on Stripe Radar rules (default is fine) and email receipts (*Settings → Emails*).
- Terms page already says 13+; payments should be made by an adult or with a parent's permission, since card holders must be adults.
- Check if you need to collect sales tax/VAT: Stripe Tax can be turned on later with `automatic_tax: { enabled: true }`.

## Later: Pro subscription

- Create a Product + recurring Price in the Dashboard, store the price id in an env var.
- Checkout in `subscription` mode, save the Stripe Customer id on `User`.
- Handle `customer.subscription.created/updated/deleted` and `invoice.paid` / `invoice.payment_failed` in the same webhook.
- Use the Customer Portal so users can cancel or change card themselves.
