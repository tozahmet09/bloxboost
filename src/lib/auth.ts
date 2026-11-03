import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE = "bb_session";
const SESSION_DAYS = 30;

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.session.create({ data: { id, userId, expiresAt } });
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) await db.session.deleteMany({ where: { id } });
  jar.delete(COOKIE);
}

export async function getUser() {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const s = await db.session.findUnique({ where: { id }, include: { user: true } });
  if (!s || s.expiresAt < new Date()) return null;
  return s.user;
}

export async function requireUser() {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}
