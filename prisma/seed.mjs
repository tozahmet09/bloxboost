// Demo data for local dev. Run: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const user = await db.user.upsert({
  where: { email: "demo@spawnswap.dev" },
  update: {},
  create: {
    email: "demo@spawnswap.dev",
    displayName: "Demo Studio",
    passwordHash: await bcrypt.hash("demo12345", 10),
    credits: 20,
  },
});
const demo = [
  ["1000000001", "Obby Rush Tycoon", "Obby", 12, 10, true],
  ["1000000002", "Pet Bakery Simulator", "Simulator", 4, 10, false],
  ["1000000003", "Midnight Hospital", "Horror", 31, 5, true],
  ["1000000004", "Sky Islands RP", "Roleplay", 7, 0, false],
];
for (const [placeId, name, genre, playing, players, featured] of demo) {
  const g = await db.game.upsert({
    where: { placeId },
    update: {},
    create: {
      ownerId: user.id, placeId, name, genre, playing, visits: playing * 40,
      description: `A demo ${genre.toLowerCase()} game.`,
      scriptLastSeen: new Date(),
      featuredUntil: featured ? new Date(Date.now() + 3 * 864e5) : null,
    },
  });
  if (players && !(await db.campaign.findFirst({ where: { gameId: g.id } })))
    await db.campaign.create({ data: { gameId: g.id, targetPlayers: players } });
}
console.log("Seeded. Log in as demo@spawnswap.dev / demo12345");
await db.$disconnect();
