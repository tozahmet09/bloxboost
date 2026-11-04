import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { TRAILER_MAX_MB, TRAILER_TYPES } from "@/lib/trailer";

// Hands the browser a short-lived token so the video goes straight to Vercel Blob storage.
// The file never passes through our server, so there is no 4.5 MB request limit.
export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json({ error: "Video uploads aren't switched on yet. Paste a YouTube link instead." }, { status: 503 });

  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getUser();
        if (!user) throw new Error("Please log in again.");
        const gameId = String(clientPayload ?? "");
        const game = await db.game.findFirst({ where: { id: gameId, ownerId: user.id }, select: { id: true } });
        if (!game) throw new Error("Game not found.");
        const exts = Object.values(TRAILER_TYPES).join("|");
        if (!new RegExp(`^trailers/${game.id}\\.(${exts})$`).test(pathname)) throw new Error("Bad file name.");
        return {
          allowedContentTypes: Object.keys(TRAILER_TYPES),
          maximumSizeInBytes: TRAILER_MAX_MB * 1024 * 1024,
          addRandomSuffix: true,
          validUntil: Date.now() + 15 * 60e3,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
