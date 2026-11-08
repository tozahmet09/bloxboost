import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "./auth";

// Who may approve or reject trailers. Set ADMIN_EMAILS in Vercel (comma separated) to change it.
const DEFAULT_ADMINS = "tozahmet0912@gmail.com";

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || DEFAULT_ADMINS).split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Logged-in admin, or a 404 for everyone else (so the page doesn't advertise itself). */
export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) notFound();
  return user;
}
