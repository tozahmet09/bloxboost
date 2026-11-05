import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · BloxBoost" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="November 3, 2026">
      <p>We collect as little as we can and never sell it.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account:</b> your email, a display name and your password (stored only as a secure hash).</li>
        <li><b>Roblox account:</b> your Roblox username and user id, once you link them. We read your public profile only to check the link code.</li>
        <li><b>Games:</b> public info from Roblox about games you add (name, icon, player counts) and the trailer link you give.</li>
        <li><b>Playtime:</b> the playtime check script in a game reports, once a minute, only the players who chose that game on BloxBoost and are still in it. Other players in the server are never sent to us. We use this only to count those 10 minutes.</li>
        <li><b>Reviews:</b> the rating and text you write. The game&apos;s developer sees them with your Roblox username.</li>
        <li><b>Payments:</b> Stripe handles card details. We only see the amount and whether it was paid.</li>
        <li><b>Visits:</b> when you open a game from our homepage we store a one-way hash of your IP address and browser, reset daily, to count unique visits. We don&apos;t store the IP address itself.</li>
      </ul>

      <h2>Cookies</h2>
      <p>One cookie keeps you logged in. No advertising or tracking cookies. Trailers play through YouTube&apos;s privacy-enhanced mode (youtube-nocookie.com).</p>

      <h2>Who we share it with</h2>
      <ul>
        <li>Stripe, to take payments.</li>
        <li>Our hosting and database providers, to run the site.</li>
        <li>Nobody else, unless the law requires it.</li>
      </ul>

      <h2>Children</h2>
      <p>BloxBoost is for people aged 13 and over. If you believe a child under 13 has made an account, tell us and we&apos;ll delete it.</p>

      <h2>Your choices</h2>
      <p>You can ask us to show you, correct or delete your data at any time. Deleting your account removes your account, games and reviews.</p>
    </LegalPage>
  );
}
