import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { operator } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy · Spawnswap" };

export default function Privacy() {
  const op = operator();
  return (
    <LegalPage title="Privacy Policy" updated="November 5, 2026">
      <p>We collect as little as we can and never sell it. This page explains what we keep, why, for how long, and what you can ask us to do with it.</p>

      <h2>Who is responsible</h2>
      <p>
        Spawnswap is run by {op.name ?? "an independent developer"}{op.country ? ` in ${op.country}` : ""}, who is responsible for your data
        (the &quot;data controller&quot;). You can reach us at {op.email ?? <Link href="/contact">the contact page</Link>}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account:</b> your email, a display name and your password (stored only as a secure hash).</li>
        <li><b>Roblox account:</b> your Roblox username, user id and the date the Roblox account was created, once you link them. We read your public profile only to check the link code and to stop brand-new alt accounts from collecting invite bonuses.</li>
        <li><b>Games:</b> public info from Roblox about games you add (name, icon, player counts) and the trailer you give.</li>
        <li><b>Trailer videos:</b> if you upload a video, it is stored with our file storage provider and shown publicly on Spawnswap.</li>
        <li><b>Playtime:</b> if a game has the playtime check script, it reports once a minute only the players who chose that game on Spawnswap and are still in it. Other players in the server are never sent to us. For games without it, we check your public Roblox online status (whether you are in a game) about once a minute while you have a game going on Spawnswap. We only use this to count playtime for games you started on Spawnswap.</li>
        <li><b>Comments, likes and leaderboards:</b> comments you post and the games and comments you like. Your Roblox username (or display name if you haven&apos;t linked Roblox) is shown publicly next to your comments and on the leaderboards.</li>
        <li><b>Invites:</b> if you joined with someone&apos;s invite link, we store who invited you so we can give both of you the bonus.</li>
        <li><b>Reviews:</b> the rating and text you write. The game&apos;s developer sees them with your Roblox username.</li>
        <li><b>Payments:</b> {op.payments} handles card details. We never see your card number, only the amount and whether it was paid.</li>
        <li><b>Visits:</b> when you open a game from our homepage we store a one-way hash of your IP address and browser, reset daily, to count unique visits. We don&apos;t store the IP address itself.</li>
        <li><b>Security:</b> to stop password guessing and spam we briefly log attempts to log in or sign up, keyed by IP address or email. These records are deleted after about a day.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To run your account and the credit swap you signed up for (needed to provide the service).</li>
        <li>To prevent cheating, fake plays and abuse (our legitimate interest in a fair service).</li>
        <li>To take payments and keep tax and accounting records (legal obligation).</li>
      </ul>
      <p>We don&apos;t use your data for advertising, and we don&apos;t sell or rent it to anyone.</p>

      <h2 id="cookies">Cookies</h2>
      <p>
        We use one cookie, <b>bb_session</b>, which keeps you logged in. It is strictly necessary, so we don&apos;t ask for consent.
        We use no advertising, analytics or tracking cookies. Trailers play through YouTube&apos;s privacy-enhanced mode
        (youtube-nocookie.com); YouTube may store data in your browser once you press play. The checkout page is run by {op.payments}, which uses its own cookies to prevent fraud.
      </p>

      <h2>Who we share it with</h2>
      <ul>
        <li>{op.payments}, to take payments.</li>
        <li>Our hosting, database and file storage providers (Vercel and Neon), to run the site.</li>
        <li>Roblox, only in the sense that we ask Roblox&apos;s public APIs about the user ids and games on Spawnswap.</li>
        <li>Nobody else, unless the law requires it.</li>
      </ul>
      <p>These providers may store data outside your country (for example in the United States or the EU). We only use providers that protect it with standard contractual safeguards.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Account, games, reviews and comments: until you delete your account.</li>
        <li>Payment records: as long as tax law requires (usually up to 10 years), even after the account is gone.</li>
        <li>Visit hashes and security logs: a few days at most.</li>
      </ul>

      <h2>Children</h2>
      <p>Spawnswap is for people aged 13 and over. We don&apos;t knowingly collect data from children under 13. If you believe a child under 13 has made an account, tell us and we&apos;ll delete it.</p>

      <h2>Your rights</h2>
      <p>
        You can ask us to show you a copy of your data, correct it, delete it, or stop using it, and to send it to you in a common format.
        Write to us and we&apos;ll answer within 30 days. Deleting your account removes your account, games, comments and reviews
        (payment records we must keep by law stay). If you think we handled your data wrongly, you can also complain to the data protection
        authority in your country.
      </p>

      <h2>Changes</h2>
      <p>If we change this policy in a way that matters, we&apos;ll say so on the site before it takes effect.</p>
    </LegalPage>
  );
}
