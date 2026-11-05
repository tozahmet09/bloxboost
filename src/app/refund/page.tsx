import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { operator } from "@/lib/legal";

export const metadata: Metadata = { title: "Refund Policy · BloxBoost" };

export default function Refund() {
  const op = operator();
  return (
    <LegalPage title="Refund Policy" updated="November 5, 2026">
      <p>We want you to feel safe buying credits. Here is exactly when you get your money back.</p>

      <h2>Credit packs</h2>
      <ul>
        <li>You can get a full refund within <b>14 days</b> of buying a pack, as long as none of its credits have been used.</li>
        <li>Once you start a campaign, the credits used for it count as used. Credits that come back from a stopped campaign count as unused again.</li>
        <li>If you used some credits from a pack, we can refund the unused part on request.</li>
      </ul>

      <h2>Homepage spotlight</h2>
      <ul>
        <li>A spotlight that hasn&apos;t started yet can be refunded in full.</li>
        <li>A spotlight that has already started can&apos;t be refunded, because your game has already been shown.</li>
      </ul>

      <h2>When something went wrong</h2>
      <p>If you were charged twice, charged but got nothing, or a campaign didn&apos;t deliver because of a problem on our side, we refund it in full, whatever the date.</p>

      <h2>How to ask</h2>
      <p>
        Email us{op.email ? <> at <span className="select-all text-cream">{op.email}</span></> : ""} from the email on your account and tell us which purchase it is.
        Refunds go back to the card you paid with through {op.payments} and usually arrive within 5 to 10 business days.
        When a pack is refunded, its credits are removed from your balance.
      </p>

      <h2>Chargebacks</h2>
      <p>Please contact us before disputing a charge with your bank. We usually fix it faster. If a payment is disputed, the credits or spotlight it bought are removed while the dispute is open.</p>

      <p>This policy doesn&apos;t take away any rights you have under the consumer law of your country.</p>
    </LegalPage>
  );
}
