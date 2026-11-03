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
      </Form>
      <p className="text-center text-sm text-mute">Have an account? <Link href="/login" className="text-marquee">Log in</Link></p>
    </div>
  );
}
