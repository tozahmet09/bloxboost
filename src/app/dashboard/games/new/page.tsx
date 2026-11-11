import { requireUser } from "@/lib/auth";
import { addGame } from "@/app/actions";
import { Form } from "@/components/Form";

export const dynamic = "force-dynamic";

export default async function NewGame() {
  await requireUser();
  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div>
        <p className="eyebrow">Add game</p>
        <h1 className="mt-1 page-title">Paste your Roblox link</h1>
        <p className="mt-2 text-sm text-mute">Name, icon and player count come in automatically. Your game shows on the site right away.</p>
      </div>
      <Form action={addGame} submit="Add game">
        <div>
          <label htmlFor="placeUrl" className="label">Roblox game link</label>
          <input id="placeUrl" name="placeUrl" aria-describedby="placeUrl-help" required placeholder="https://www.roblox.com/games/123456789/My-Game" className="input" />
          <div id="placeUrl-help" className="mt-3 space-y-1.5 text-sm text-mute">
            <p className="text-cream">Where to find it</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Open your game on <a href="https://www.roblox.com/home" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-cream">roblox.com</a> in a browser.</li>
              <li>Copy the address from the top of the browser. It looks like <span className="whitespace-nowrap font-mono text-xs text-cream">roblox.com/games/123456789/…</span></li>
            </ol>
            <p>Or in Creator Dashboard, click the <span className="text-cream">⋯</span> on your game and choose <span className="text-cream">Copy URL</span>. The number alone (the place ID) works too.</p>
          </div>
        </div>
      </Form>
    </div>
  );
}
