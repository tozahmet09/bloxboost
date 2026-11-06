# Spawnswap

Real, verified players for new Roblox games, without a big ad budget.

**How it works**

- **Ad swap:** a developer links their Roblox account, plays another dev's game for 10 minutes and leaves feedback: +1 credit.
- **1 credit = 1 verified player.** A dev starts a campaign ("I want 50 players"), credits are reserved, and the game shows up in the *Play & earn* queue.
- **Verification:** each game runs a small server Script (generated per game on its dashboard page) that pings `/api/track` every 60 s with the user ids in the server. Playtime only counts for players who reserved that game on Spawnswap.
- **Paid credit packs:** $5 = 50, $10 = 120, $20 = 300 players (Stripe Checkout).
- **Featured slot:** $3 / 1 day, $7 / 3 days, $10 / 7 days at the top of the homepage.
- No Robux payments.

## Run locally

Needs a Postgres database (a free one from [neon.tech](https://neon.tech) works). Put its URL in `.env` as `DATABASE_URL`.

```bash
npm install
cp .env.example .env   # then paste your DATABASE_URL
npm run db:push
npm run db:seed     # optional demo data: demo@spawnswap.dev / demo12345
npm run dev
```

Without `STRIPE_SECRET_KEY`, purchases run in **test mode** (free, instant) on local dev. On the live site they are switched off until a key is set.
For local testing you can set `REQUIRED_PLAY_SECONDS=60` and, in dev only, `ROBLOX_VERIFY_SKIP=1`.

## Going live

1. Vercel: *Add New → Project* → import this repo. In the project go to *Storage → Create → Neon (Postgres)* and connect it, which sets `DATABASE_URL`. Redeploy. The build creates the tables (`prisma db push`).
2. Set `APP_URL` to the public https URL. The tracker script points there.
3. Stripe: follow [docs/STRIPE.md](docs/STRIPE.md) (keys, webhook events, test card).
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
