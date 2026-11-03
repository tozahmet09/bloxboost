import { requireUser } from "@/lib/auth";
import { addGame } from "@/app/actions";
import { Form } from "@/components/Form";

export default async function NewGame() {
  await requireUser();
  return (
    <div className="card mx-auto max-w-lg p-6">
      <h1 className="mb-1 text-2xl font-bold">Add a game</h1>
      <p className="mb-6 text-sm text-slate-400">
        Paste the link to your game&apos;s Roblox page. We pull the name, icon and player count automatically.
      </p>
      <Form action={addGame} submit="Add game">
        <div>
          <label className="label">Roblox game link</label>
          <input name="placeUrl" required placeholder="https://www.roblox.com/games/123456789/My-Game" className="input" />
        </div>
      </Form>
    </div>
  );
}
