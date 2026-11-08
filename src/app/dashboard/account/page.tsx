import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteAccount } from "@/app/actions";
import { Form } from "@/components/Form";

export const dynamic = "force-dynamic";

export default async function Account() {
  const user = await requireUser();
  const games = await db.game.count({ where: { ownerId: user.id } });
  return (
    <div className="mx-auto max-w-xl space-y-10">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="mt-1 page-title">{user.displayName}</h1>
        <p className="mt-1 text-mute">{user.email}</p>
      </div>

      <section className="rule space-y-4 pt-8">
        <h2 className="text-xl font-bold">Delete account</h2>
        <div className="space-y-2 text-sm text-mute">
          <p>
            This removes your account, your {games === 1 ? "game" : `${games} games`}, trailers, likes, comments and reviews,
            and unlinks your Roblox account. It can&apos;t be undone.
          </p>
          <p>
            Your <b className="text-cream tabular-nums">{user.credits}</b> credits are lost. If you bought credits you haven&apos;t used,
            ask for a refund on the <Link href="/contact" className="text-cream underline">contact page</Link> first.
            Payment records stay because tax law requires it.
          </p>
        </div>
        <Form action={deleteAccount} submit="Delete my account" buttonClass="btn bg-danger hover:bg-danger/80">
          <div>
            <label htmlFor="password" className="label">Your password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input name="confirm" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#ff8a7a]" />
            <span>I understand my account and games will be deleted for good.</span>
          </label>
        </Form>
      </section>
    </div>
  );
}
