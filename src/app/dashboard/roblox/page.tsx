import { requireUser } from "@/lib/auth";
import { Form } from "@/components/Form";
import { startRobloxLink, verifyRobloxLink } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function LinkRoblox() {
  const user = await requireUser();
  return (
    <div className="card mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Link your Roblox account</h1>
        {user.robloxVerified && (
          <p className="mt-2 text-sm text-brand">Linked as {user.robloxUsername}. You can link a different account below.</p>
        )}
      </div>
      <Form action={startRobloxLink} submit={user.robloxVerifyCode ? "Get a new code" : "Next"}>
        <div>
          <label className="label">Roblox username</label>
          <input name="username" required className="input" />
        </div>
      </Form>
      {user.robloxVerifyCode && (
        <div className="space-y-3 border-t border-slate-800 pt-6">
          <p className="text-sm">
            Prove it&apos;s you: put this code anywhere in your Roblox profile <b>About</b> section, save, then press Verify.
            You can remove it afterwards.
          </p>
          <code className="block rounded-lg bg-slate-800 p-3 text-center text-lg font-bold text-brand">{user.robloxVerifyCode}</code>
          <p className="text-xs text-slate-500">Account: {user.robloxUsername?.split("#")[0]}</p>
          <Form action={verifyRobloxLink} submit="Verify" />
        </div>
      )}
    </div>
  );
}
