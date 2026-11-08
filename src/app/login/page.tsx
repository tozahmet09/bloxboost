import Link from "next/link";
import { login } from "../actions";
import { Form } from "@/components/Form";

export default function Login() {
  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <h1 className="page-title">Welcome back</h1>
      <Form action={login} submit="Log in">
        <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" required className="input" /></div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot-password" className="text-sm text-coral">Forgot your password?</Link>
          </div>
          <input id="password" name="password" type="password" required className="input" />
        </div>
      </Form>
      <p className="text-center text-sm text-mute">New here? <Link href="/signup" className="text-coral">Create an account</Link></p>
    </div>
  );
}
