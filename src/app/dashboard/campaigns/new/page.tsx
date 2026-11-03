import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createCampaign } from "@/app/actions";
import { Form } from "@/components/Form";

export default async function NewCampaign({ searchParams }: { searchParams: Promise<{ gameId?: string }> }) {
  const user = await requireUser();
  const { gameId } = await searchParams;
  const games = await db.game.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="card mx-auto max-w-lg p-6">
      <h1 className="mb-1 text-2xl font-bold">New campaign</h1>
      <p className="mb-6 text-sm text-slate-400">
        You only pay when a player clicks through to your game (one charge per player per day).
        Higher bids show up more often in &quot;Featured today&quot;.
      </p>
      <Form action={createCampaign} submit="Launch campaign">
        <div>
          <label className="label">Game</label>
          <select name="gameId" defaultValue={gameId} className="input">
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Bid per click ($)</label>
            <input name="bid" type="number" step="0.01" min="0.02" defaultValue="0.05" className="input" />
          </div>
          <div>
            <label className="label">Daily budget ($)</label>
            <input name="dailyBudget" type="number" step="0.5" min="1" defaultValue="2" className="input" />
          </div>
        </div>
        <p className="text-xs text-slate-500">Example: $0.05 bid with a $2/day budget = up to 40 new players a day.</p>
      </Form>
    </div>
  );
}
