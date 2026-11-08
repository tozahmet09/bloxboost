import Link from "next/link";
import { resetPassword } from "../actions";
import { Form } from "@/components/Form";

// The reset token is in the address bar, so never send it to other sites as a referrer.
export const metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token))
    return (
      <div className="mx-auto max-w-sm space-y-4 py-6">
        <h1 className="text-3xl font-extrabold">This link doesn&apos;t work</h1>
        <p className="text-sm text-mute">Open the link from your email again, or ask for a new one.</p>
        <Link href="/forgot-password" className="btn w-full">Get a new link</Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <h1 className="text-3xl font-extrabold">Choose a new password</h1>
      <Form action={resetPassword} submit="Save new password">
        <input type="hidden" name="token" value={token} />
        <div><label htmlFor="password" className="label">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" /></div>
        <div><label htmlFor="confirm" className="label">Type it again</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required className="input" /></div>
      </Form>
      <p className="text-center text-sm text-mute"><Link href="/forgot-password" className="text-marquee">Get a new link</Link></p>
    </div>
  );
}
