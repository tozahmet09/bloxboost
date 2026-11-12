import Link from "next/link";
import { signup } from "../actions";
import { Form } from "@/components/Form";
import { REFERRAL_CREDITS } from "@/lib/money";

export default async function Signup({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref = "" } = await searchParams;
  const code = /^[a-z0-9]{4,12}$/i.test(ref) ? ref : "";
  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <div>
        <p className="eyebrow">Free account</p>
        <h1 className="mt-1 page-title">Get your game seen</h1>
      </div>
      {code && <p className="rounded-ctl border border-lime/40 bg-lime/10 px-4 py-3 text-sm">A friend invited you. You start with +{REFERRAL_CREDITS} bonus credits.</p>}
      <Form action={signup} submit="Create account">
        <input type="hidden" name="ref" value={code} />
        <div><label htmlFor="displayName" className="label">Name or studio</label><input id="displayName" name="displayName" className="input" /></div>
        <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" required className="input" /></div>
        <div><label htmlFor="password" className="label">Password</label><input id="password" name="password" type="password" minLength={8} required className="input" /></div>
        <label className="flex items-start gap-3 text-sm text-mute">
          <input id="agree" name="agree" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#c8f031]" />
          <span>I&apos;m 13 or older and agree to the <Link href="/terms" className="text-cream underline">Terms</Link> and <Link href="/privacy" className="text-cream underline">Privacy Policy</Link>.</span>
        </label>
      </Form>
      <p className="text-center text-sm text-mute">Have an account? <Link href="/login" className="text-lime">Log in</Link></p>
    </div>
  );
}
