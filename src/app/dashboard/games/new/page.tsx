import Link from "next/link";
import { Check } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { addGame } from "@/app/actions";
import { postingRequirement } from "@/lib/community";
import { Form } from "@/components/Form";

export const dynamic = "force-dynamic";

export default async function NewGame() {
  const user = await requireUser();
  const req = await postingRequirement(user.id);
  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div>
        <p className="eyebrow">Add game</p>
        <h1 className="mt-1 text-3xl font-extrabold">{req.left > 0 ? "Play first, then post" : "Paste your Roblox link"}</h1>
        <p className="mt-2 text-sm text-mute">
          {req.left > 0
            ? `Everyone plays ${req.needed} games before posting their own. That's how every game here gets real players.`
            : "Name, icon and player count come in automatically."}
        </p>
      </div>
      {req.needed > 0 && (
        <ol className="flex gap-2" aria-label={`${req.done} of ${req.needed} games played`}>
          {Array.from({ length: req.needed }, (_, i) => (
            <li key={i} className={`flex h-10 flex-1 items-center justify-center rounded-ctl border text-sm ${i < req.done ? "border-verified bg-verified/10 text-verified" : "border-line text-mute"}`}>
              {i < req.done ? <Check className="h-4 w-4" /> : `Game ${i + 1}`}
            </li>
          ))}
        </ol>
      )}
      {req.left > 0 ? (
        <Link href="/play" className="btn w-full">Play {req.left} more game{req.left === 1 ? "" : "s"}</Link>
      ) : (
        <Form action={addGame} submit="Add game">
          <input name="placeUrl" aria-label="Roblox game link" required placeholder="roblox.com/games/123456789/My-Game" className="input" />
        </Form>
      )}
    </div>
  );
}
