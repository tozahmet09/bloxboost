import Link from "next/link";
import { redirect } from "next/navigation";
import { Link2 } from "lucide-react";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * The Progress tab. Games that give credits live on the homepage, so this only sends you to "My progress"
 * (or asks you to link Roblox first). Errors from starting a game are passed along.
 */
export default async function Play({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/signup");
  const { error } = await searchParams;

  if (!user.robloxVerified) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <Link2 className="mx-auto h-8 w-8 text-lime" />
        <h1 className="page-title">Link your Roblox account</h1>
        <p className="text-mute">So games can see it&apos;s you playing.</p>
        <Link href="/dashboard/roblox" className="btn">Link account</Link>
      </div>
    );
  }
  redirect(error ? `/play/tasks?error=${encodeURIComponent(error)}` : "/play/tasks");
}
