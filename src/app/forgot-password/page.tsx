import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { Form } from "@/components/Form";

export const metadata = { title: "Forgot password" };

export default function ForgotPassword() {
  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <div>
        <h1 className="page-title">Forgot your password?</h1>
        <p className="mt-2 text-sm text-mute">Enter the email you signed up with. We&apos;ll send you a link to choose a new password.</p>
      </div>
      <Form action={requestPasswordReset} submit="Send reset link">
        <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" autoComplete="email" required className="input" /></div>
      </Form>
      <p className="text-center text-sm text-mute">Remembered it? <Link href="/login" className="text-marquee">Log in</Link></p>
    </div>
  );
}
