import { requireUser } from "@/lib/auth";
import { Form } from "@/components/Form";
import { CopyButton } from "@/components/CopyButton";
import { startRobloxLink, verifyRobloxLink } from "@/app/actions";
import { robloxOauthEnabled } from "@/lib/robloxOauth";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  cancelled: "Roblox sign-in was cancelled. Try again when you're ready.",
  expired: "That sign-in took too long or was opened in another tab. Try again.",
  roblox: "Couldn't reach Roblox. Try again in a minute, or use the code below.",
  taken: "That Roblox account is already linked to someone else.",
  slow: "Too many tries. Wait a few minutes and try again.",
  off: "Roblox sign-in isn't available right now. Use the code below.",
};

export default async function LinkRoblox({ searchParams }: { searchParams: Promise<{ error?: string; oauth?: string }> }) {
  const user = await requireUser();
  const { error, oauth: tryOauth } = await searchParams;
  // Until Roblox approves the app it only works for 10 test accounts, so the button stays hidden
  // (open /dashboard/roblox?oauth=1 to test) until ROBLOX_OAUTH_PUBLIC=1.
  const oauth = robloxOauthEnabled() && (process.env.ROBLOX_OAUTH_PUBLIC === "1" || tryOauth === "1");
  const codeForm = (
    <>
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
            <code className="flex-1 rounded-ctl bg-panel px-4 py-3 text-center font-display text-lg font-bold tracking-wide text-lime">{user.robloxVerifyCode}</code>
            <CopyButton text={user.robloxVerifyCode} />
          </div>
          <Form action={verifyRobloxLink} submit="Verify" />
        </div>
      )}
    </>
  );
  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <p className="eyebrow">Roblox account</p>
        <h1 className="mt-1 page-title">Link your account</h1>
        {user.robloxVerified && <p className="mt-2 text-sm text-verified">Linked as {user.robloxUsername}.</p>}
        {error && ERRORS[error] && <p className="mt-2 text-sm text-danger">{ERRORS[error]}</p>}
      </div>
      {oauth ? (
        <>
          <div className="space-y-3">
            <a href="/api/roblox/start" className="btn w-full">Sign in with Roblox</a>
            <p className="text-sm text-mute">
              Roblox only tells us your username and account age, so we can count your plays. We never see your password, Robux or items.
            </p>
          </div>
          <details className="rule pt-6">
            <summary className="cursor-pointer text-sm text-mute">Or link with a code instead</summary>
            <div className="mt-6 space-y-8">{codeForm}</div>
          </details>
        </>
      ) : (
        codeForm
      )}
    </div>
  );
}
