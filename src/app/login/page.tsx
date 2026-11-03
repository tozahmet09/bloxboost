import Link from "next/link";
import { login } from "../actions";
import { Form } from "@/components/Form";

export default function Login() {
  return (
    <div className="card mx-auto max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold">Log in</h1>
      <Form action={login} submit="Log in">
        <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
        <div><label className="label">Password</label><input name="password" type="password" required className="input" /></div>
      </Form>
      <p className="mt-4 text-center text-sm text-slate-400">
        New here? <Link href="/signup" className="text-brand">Create an account</Link>
      </p>
    </div>
  );
}
