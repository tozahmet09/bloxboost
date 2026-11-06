/** Who runs the site, for the legal pages. Set these in Vercel > Settings > Environment Variables. */
export function operator() {
  return {
    name: process.env.OPERATOR_NAME?.trim() || null, // e.g. "Ahmet T." or a company name
    country: process.env.OPERATOR_COUNTRY?.trim() || null, // e.g. "Türkiye"
    email: process.env.CONTACT_EMAIL?.trim() || null,
    payments: process.env.PAYMENT_PROVIDER?.trim() || "Stripe",
  };
}
