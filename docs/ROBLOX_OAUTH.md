# Sign in with Roblox

Lets users link their Roblox account with one click instead of pasting a code in their profile About.
We only ask Roblox for `openid profile` (user id, username, account age).

## 1. Create the app on Roblox
1. Go to https://create.roblox.com/dashboard/credentials and open **OAuth 2.0 Apps**, then **Create App**.
2. Name it `Spawnswap`, accept the terms, **Create**.
3. Copy the **Client ID** and **Secret** right away (the secret is shown only once).
4. **Continue to Edit**:
   - Redirect URL: `https://spawnswap.com/api/roblox/callback`
   - Scopes: `openid` and `profile`
   - Entry link `https://spawnswap.com`, Privacy `https://spawnswap.com/privacy`, Terms `https://spawnswap.com/terms`, a description and a 512x512 icon.
5. Save.

## 2. Add the keys to Vercel
Vercel > bloxboost > Settings > Environment Variables (Production):
- `ROBLOX_OAUTH_CLIENT_ID` = the Client ID
- `ROBLOX_OAUTH_CLIENT_SECRET` = the Secret

Redeploy. The button now shows at https://spawnswap.com/dashboard/roblox?oauth=1 (testing only).

## 3. Get it approved
A new app is "private": max 10 Roblox users. To open it to everyone, submit it for review on the same page:
- a public demo video (max 1 minute): start signed out of Roblox, click **Sign in with Roblox**, show the consent screen and coming back linked;
- a short reason: "Spawnswap counts real plays between Roblox developers. We use openid/profile only to know which Roblox account a user owns."

When Roblox approves, add `ROBLOX_OAUTH_PUBLIC` = `1` in Vercel and redeploy. The button then shows for everyone, and the About code stays as a fallback.
