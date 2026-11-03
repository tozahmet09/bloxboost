# BloxBoost

Real, verified players for new Roblox games, without a big ad budget.

**How it works**

- **Ad swap:** a developer links their Roblox account, plays another dev's game for 10 minutes and leaves feedback: +1 credit.
- **1 credit = 1 verified player.** A dev starts a campaign ("I want 50 players"), credits are reserved, and the game shows up in the *Play & earn* queue.
- **Verification:** each game runs a small server Script (generated per game on its dashboard page) that pings `/api/track` every 60 s with the user ids in the server. Playtime only counts for players who reserved that game on BloxBoost.
- **Paid credit packs:** $5 = 50, $10 = 120, $20 = 300 players (Stripe Checkout).
- **Featured slot:** $3 / 1 day, $7 / 3 days, $10 / 7 days at the top of the homepage.
- No Robux payments.

## Run locally

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed     # optional demo data: demo@bloxboost.dev / demo12345
npm run dev
```

Without `STRIPE_SECRET_KEY`, purchases run in **test mode** (free, instant).
For local testing you can set `REQUIRED_PLAY_SECONDS=60` and, in dev only, `ROBLOX_VERIFY_SKIP=1`.

## Going live

1. Host on Vercel / Railway / Fly. Switch `DATABASE_URL` to Postgres (change `provider` in `prisma/schema.prisma`).
2. Set `APP_URL` to the public https URL. The tracker script points there.
3. Stripe: set `STRIPE_SECRET_KEY`, add a webhook to `/api/stripe/webhook` for `checkout.session.completed`, set `STRIPE_WEBHOOK_SECRET`.
4. Set a random `VISITOR_SALT`.

## Code map

| Path | What |
| --- | --- |
| `src/lib/credits.ts` | Play queue, task start, heartbeat playtime counting, feedback → credit |
| `src/lib/script.ts` | The Luau tracker script devs paste into their game |
| `src/lib/roblox.ts` | Roblox public APIs: place → game info, username lookup, profile About for verification |
| `src/lib/money.ts` | Prices and rules (10 min, 3 h task expiry, max 3 open tasks) |
| `src/app/actions.ts` | All server actions (auth, games, campaigns, linking, feedback) |
| `src/app/api/track` | Endpoint the in-game script calls |
| `src/app/api/checkout`, `api/stripe/webhook` | Payments |
