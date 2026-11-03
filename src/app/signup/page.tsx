import Link from "next/link";
import { signup } from "../actions";
import { Form } from "@/components/Form";

export default function Signup() {
  return (
    <div className="card mx-auto max-w-sm p-6">
      <h1 className="mb-1 text-2xl font-bold">Promote your game</h1>
      <p className="mb-6 text-sm text-slate-400">Create a developer account. It&apos;s free.</p>
      <Form action={signup} submit="Create account">
        <div><label className="label">Name or studio</label><input name="displayName" className="input" /></div>
        <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
        <div><label className="label">Password</label><input name="password" type="password" minLength={8} required className="input" /></div>
      </Form>
      <p className="mt-4 text-center text-sm text-slate-400">
        Have an account? <Link href="/login" className="text-brand">Log in</Link>
      </p>
    </div>
  );
}
