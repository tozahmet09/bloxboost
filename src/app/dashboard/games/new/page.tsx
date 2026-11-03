import { requireUser } from "@/lib/auth";
import { addGame } from "@/app/actions";
import { Form } from "@/components/Form";

export default async function NewGame() {
  await requireUser();
  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div>
        <p className="eyebrow">Add game</p>
        <h1 className="mt-1 text-3xl font-extrabold">Paste your Roblox link</h1>
        <p className="mt-2 text-sm text-mute">Name, icon and player count come in automatically.</p>
      </div>
      <Form action={addGame} submit="Add game">
        <input name="placeUrl" aria-label="Roblox game link" required placeholder="roblox.com/games/123456789/My-Game" className="input" />
      </Form>
    </div>
  );
}
