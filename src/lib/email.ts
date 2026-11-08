import "server-only";

/** True when the site can send real emails (a Resend key is set). */
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY?.trim());

/**
 * Sends one email through Resend's HTTP API. Returns false if it could not be sent.
 * Without a key (local dev) the email is printed to the server log instead.
 */
export async function sendEmail(to: string, subject: string, text: string, html: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.log(`[email not sent: RESEND_API_KEY is empty]\nTo: ${to}\nSubject: ${subject}\n\n${text}`);
    return false;
  }
  const from = process.env.EMAIL_FROM?.trim() || "Spawnswap <noreply@spawnswap.com>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
    });
    if (!res.ok) console.error("Resend error", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("Resend request failed", e);
    return false;
  }
}
