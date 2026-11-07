import type { Metadata } from "next";
import Link from "next/link";
import { operator } from "@/lib/legal";

export const metadata: Metadata = { title: "Contact · Spawnswap" };

export default function Contact() {
  const op = operator();
  return (
    <article className="mx-auto max-w-2xl space-y-5 leading-relaxed">
      <div>
        <p className="eyebrow">Help</p>
        <h1 className="mt-1 text-3xl font-extrabold">Contact us</h1>
      </div>
      {op.email ? (
        <p className="text-cream/90">
          Email <span className="select-all font-semibold text-cream">{op.email}</span>. We usually answer within two days.
        </p>
      ) : (
        <p className="text-cream/90">Our support email is being set up. Please check back soon.</p>
      )}
      <ul className="ml-5 list-disc space-y-1.5 text-cream/90">
        <li>Refunds and payments: say which purchase it is (see the <Link href="/refund" className="underline">refund policy</Link>).</li>
        <li>Someone else added your game: send the game link and proof you own it.</li>
        <li>Report a comment, trailer or cheating account: send the page link.</li>
        <li>Delete your account: do it yourself in <Link href="/dashboard/account" className="underline">Account settings</Link>.</li>
        <li>See a copy of your data: write from the email on your account (see the <Link href="/privacy" className="underline">privacy policy</Link>).</li>
      </ul>
      <p className="text-sm text-mute">
        Spawnswap is run by {op.name ?? "an independent developer"}{op.country ? `, ${op.country}` : ""}. Not affiliated with Roblox Corporation.
      </p>
    </article>
  );
}
