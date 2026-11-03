export const MIN_BID_CENTS = 2; // $0.02 per click
export const MIN_DAILY_BUDGET_CENTS = 100; // $1 / day
export const TOPUP_OPTIONS_CENTS = [500, 1000, 2500, 5000];

export function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
