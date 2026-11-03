import { requireUser } from "@/lib/auth";
import { Form } from "@/components/Form";
import { CopyButton } from "@/components/CopyButton";
import { startRobloxLink, verifyRobloxLink } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function LinkRoblox() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <p className="eyebrow">Roblox account</p>
        <h1 className="mt-1 text-3xl font-extrabold">Link your account</h1>
        {user.robloxVerified && <p className="mt-2 text-sm text-verified">Linked as {user.robloxUsername}.</p>}
      </div>
      <Form action={startRobloxLink} submit={user.robloxVerifyCode ? "New code" : "Next"}>
        <div>
          <label htmlFor="username" className="label">Roblox username</label>
          <input id="username" name="username" required className="input" autoComplete="off" />
        </div>
      </Form>
      {user.robloxVerifyCode && (
        <div className="rule space-y-4 pt-8">
          <p className="text-sm text-mute">
            Paste this code into your Roblox profile <b className="text-cream">About</b>, save, then verify. You can remove it after.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-ctl bg-panel px-4 py-3 text-center font-display text-lg font-bold tracking-wide text-marquee">{user.robloxVerifyCode}</code>
            <CopyButton text={user.robloxVerifyCode} />
          </div>
          <Form action={verifyRobloxLink} submit="Verify" />
        </div>
      )}
    </div>
  );
}
