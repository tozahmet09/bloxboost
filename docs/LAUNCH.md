# Launch checklist

## Vercel environment variables (Settings > Environment Variables, then Redeploy)

| Name | Needed | What |
|---|---|---|
| `DATABASE_URL` | yes | Neon connection string (already set) |
| `APP_URL` | yes | The live address, e.g. `https://bloxboost.vercel.app` (Stripe redirects + tracker script URL) |
| `VISITOR_SALT` | yes | Any long random text. Without it visit hashes use a public default |
| `CONTACT_EMAIL` | yes | Support email shown on Contact / Terms / Privacy / Refund. Payment providers check this |
| `OPERATOR_NAME`, `OPERATOR_COUNTRY` | yes | Who runs the site, for the legal pages and governing law |
| `STRIPE_SECRET_KEY` | for payments | Already set (test key) |
| `STRIPE_WEBHOOK_SECRET` | for payments | From Stripe > Developers > Webhooks, endpoint `<APP_URL>/api/stripe/webhook` (events in docs/STRIPE.md) |
| `PAYMENT_PROVIDER` | optional | Name on the legal pages if you switch away from Stripe |
| `BLOB_READ_WRITE_TOKEN` | for video uploads | Added automatically when you create a Blob store in Vercel > Storage |

Never set on the live site: `ALLOW_FREE_TEST_PAYMENTS`, `REQUIRED_PLAY_SECONDS`, `ROBLOX_VERIFY_SKIP`.

## Not built yet

- Password reset by email (needs an email service such as Resend). Until then, reset by hand on request.
- Self-serve account deletion. Until then, delete on request from the contact email.
