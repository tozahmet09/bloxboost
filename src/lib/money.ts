// Pricing. 1 credit = 1 verified player.
export const CREDIT_PACKS = [
  { id: "starter", credits: 50, cents: 500, label: "Starter" },
  { id: "boost", credits: 120, cents: 1000, label: "Boost" },
  { id: "launch", credits: 300, cents: 2000, label: "Launch" },
] as const;

export const FEATURED_OPTIONS = [
  { days: 1, cents: 300 },
  { days: 3, cents: 700 },
  { days: 7, cents: 1000 },
] as const;

/** How long someone must play before their visit counts. Override for local testing only. */
export const REQUIRED_SECONDS = Number(process.env.REQUIRED_PLAY_SECONDS ?? 600);
/** Players start a game and have this long to reach the required playtime. */
export const TASK_TTL_HOURS = 3;
/** A player can have this many unfinished games at once. */
export const MAX_OPEN_TASKS = 3;
export const MIN_FEEDBACK_CHARS = 20;
/** Script counts as installed if it pinged within this window. */
export const SCRIPT_ALIVE_MS = 24 * 3600e3;

export function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** The milestone every game works toward: its first 100 verified players. */
export const GOAL_PLAYERS = 100;

/** Early-bird bonus: the first developers to sign up start with free credits so the swap has players from day one. */
export const EARLY_BIRD_ACCOUNTS = 30;
export const EARLY_BIRD_CREDITS = 20;

/** Invite link bonus. The new user gets it at signup, the inviter once the new user finishes a first verified play. */
export const REFERRAL_CREDITS = 5;
/** Anti-abuse: an inviter can collect the invite bonus this many times at most. */
export const REFERRAL_MAX_PAID = 50;
/** Anti-abuse: the invited player's Roblox account must be at least this old for the inviter to get the bonus. */
export const REFERRAL_MIN_ROBLOX_AGE_DAYS = 30;
export const COMMENT_MAX_CHARS = 500;
export const COMMENT_COOLDOWN_MS = 20_000;
