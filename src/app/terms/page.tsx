import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Use · BloxBoost" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="November 3, 2026">
      <p>BloxBoost helps Roblox developers get their games played and lets players discover new games. By creating an account you agree to these terms.</p>

      <h2>Who can use BloxBoost</h2>
      <ul>
        <li>You must be at least 13 years old.</li>
        <li>If you are under 18, a parent or guardian must agree to these terms and make any purchase for you.</li>
        <li>One person, one account, one linked Roblox account.</li>
      </ul>

      <h2>Not affiliated with Roblox</h2>
      <p>BloxBoost is an independent service. It is not made, endorsed or sponsored by Roblox Corporation. You must also follow the Roblox Terms of Use, including on the games you list here.</p>

      <h2>Credits</h2>
      <ul>
        <li>One credit brings one player who plays your game for at least 10 minutes and leaves a review.</li>
        <li>You earn credits by playing other games for 10 minutes and leaving an honest review, or you buy them.</li>
        <li>Credits have no cash value, can&apos;t be transferred or exchanged for Robux or money, and don&apos;t expire.</li>
        <li>Credits reserved for a campaign come back to you if you stop it before they are used.</li>
      </ul>

      <h2>Fair play</h2>
      <p>To keep players real, these are not allowed and can lead to removing credits or closing the account:</p>
      <ul>
        <li>Alt accounts, bots, scripts or anything that fakes playtime or reviews.</li>
        <li>Changing the tracker script to report players who did not play.</li>
        <li>Paying or rewarding people outside BloxBoost to play through it.</li>
        <li>Copy-paste, spam or abusive reviews.</li>
      </ul>

      <h2>Your games and trailers</h2>
      <ul>
        <li>Only add games you own or are allowed to promote.</li>
        <li>Trailers must show the real game and be content you have the right to use.</li>
        <li>Games and trailers must be suitable for all ages and follow Roblox community standards. We may remove anything that isn&apos;t.</li>
        <li>You let us show your game&apos;s name, icon and trailer on BloxBoost to promote it.</li>
      </ul>

      <h2>Purchases</h2>
      <ul>
        <li>Prices are shown before you pay. Payments are processed by Stripe.</li>
        <li>Unused credit packs can be refunded within 14 days of purchase if none of the credits have been used.</li>
        <li>A homepage spotlight that has already started can&apos;t be refunded.</li>
      </ul>

      <h2>No guarantees</h2>
      <p>We verify playtime and reviews, but we can&apos;t promise how many players will stay, spend or come back. The service is provided as it is, and our responsibility is limited to the amount you paid us in the last 12 months.</p>

      <h2>Changes</h2>
      <p>We may update these terms. If a change matters, we&apos;ll tell you on the site before it takes effect.</p>
    </LegalPage>
  );
}
