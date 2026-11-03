// Demo data so the discovery page isn't empty in local dev. Run: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const user = await db.user.upsert({
  where: { email: "demo@bloxboost.dev" },
  update: {},
  create: {
    email: "demo@bloxboost.dev",
    displayName: "Demo Studio",
    passwordHash: await bcrypt.hash("demo12345", 10),
    creditCents: 1000,
  },
});
const demo = [
  ["1000000001", "Obby Rush Tycoon", "Obby", 12, 8],
  ["1000000002", "Pet Bakery Simulator", "Simulator", 4, 5],
  ["1000000003", "Midnight Hospital", "Horror", 31, 3],
  ["1000000004", "Sky Islands RP", "Roleplay", 7, 0],
];
for (const [placeId, name, genre, playing, bid] of demo) {
  const g = await db.game.upsert({
    where: { ownerId_placeId: { ownerId: user.id, placeId } },
    update: {},
    create: { ownerId: user.id, placeId, name, genre, playing, visits: playing * 40 },
  });
  if (bid && !(await db.campaign.findFirst({ where: { gameId: g.id } })))
    await db.campaign.create({ data: { gameId: g.id, bidCents: bid, dailyBudgetCents: 200 } });
}
console.log("Seeded. Log in as demo@bloxboost.dev / demo12345");
await db.$disconnect();
