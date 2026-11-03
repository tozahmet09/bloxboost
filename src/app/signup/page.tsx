import Link from "next/link";
import { signup } from "../actions";
import { Form } from "@/components/Form";

export default function Signup() {
  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <div>
        <p className="eyebrow">Free account</p>
        <h1 className="mt-1 text-3xl font-extrabold">Get your game seen</h1>
      </div>
      <Form action={signup} submit="Create account">
        <div><label htmlFor="displayName" className="label">Name or studio</label><input id="displayName" name="displayName" className="input" /></div>
        <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" required className="input" /></div>
        <div><label htmlFor="password" className="label">Password</label><input id="password" name="password" type="password" minLength={8} required className="input" /></div>
        <label className="flex items-start gap-3 text-sm text-mute">
          <input id="agree" name="agree" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#ffb238]" />
          <span>I&apos;m 13 or older and agree to the <Link href="/terms" className="text-cream underline">Terms</Link> and <Link href="/privacy" className="text-cream underline">Privacy Policy</Link>.</span>
        </label>
      </Form>
      <p className="text-center text-sm text-mute">Have an account? <Link href="/login" className="text-marquee">Log in</Link></p>
    </div>
  );
}
