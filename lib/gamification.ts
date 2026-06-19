// Gamification logic: rarity tiers, spotting streaks, and milestone badges.
//
// Rarity depends on how often a breed is spotted across the shared store
// (product-overview.md flags that rarity needs a shared backend even in an
// accountless V1). With a small early dataset the thresholds below are a
// deliberate placeholder distribution, tuned to feel rewarding rather than to
// reflect a real population — to be revisited once live spotting data exists.

export type RarityTier = "common" | "uncommon" | "rare" | "legendary";

export interface RarityMeta {
  tier: RarityTier;
  label: string;
  /** True for the gold-foil treatment (rare + legendary). */
  foil: boolean;
}

const RARITY_LABEL: Record<RarityTier, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

/**
 * Map a breed's GLOBAL spotting count to a rarity tier. Fewer global sightings
 * means rarer: a breed almost nobody has captured is legendary.
 */
export function rarityForGlobalCount(globalCount: number): RarityTier {
  if (globalCount <= 1) return "legendary";
  if (globalCount <= 3) return "rare";
  if (globalCount <= 8) return "uncommon";
  return "common";
}

export function rarityMeta(globalCount: number): RarityMeta {
  const tier = rarityForGlobalCount(globalCount);
  return { tier, label: RARITY_LABEL[tier], foil: tier === "rare" || tier === "legendary" };
}

/**
 * Compute the current consecutive-day spotting streak (and the longest ever)
 * from a list of sighting timestamps. "Current" counts back from today; a gap
 * of more than one calendar day breaks it. Timezone uses the server's local
 * day boundaries, which is good enough for a single-device V1.
 */
export function computeStreak(dates: Array<string | Date>): {
  current: number;
  longest: number;
} {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const dayMs = 86_400_000;
  const toDayIndex = (d: string | Date) => Math.floor(new Date(d).getTime() / dayMs);

  const days = Array.from(new Set(dates.map(toDayIndex))).sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: walk back from the most recent spotting day, but only if it
  // is today or yesterday (otherwise the streak has lapsed).
  const today = toDayIndex(new Date());
  const last = days[days.length - 1];
  let current = 0;
  if (today - last <= 1) {
    current = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      if (days[i] === days[i + 1] - 1) current += 1;
      else break;
    }
  }

  return { current, longest };
}

export interface BadgeInput {
  uniqueBreeds: number;
  totalSightings: number;
  legendaryCount: number;
  placesCount: number;
  sharedCount: number;
  currentStreak: number;
}

export interface Badge {
  key: string;
  label: string;
  icon: string;
  description: string;
  earned: boolean;
  /** Progress toward earning, 0..1, for not-yet-earned badges. */
  progress: number;
}

/**
 * Milestone badge set. Each badge has a threshold against a single metric so
 * the "You" tab can show both earned badges and progress toward the next ones.
 */
export function computeBadges(input: BadgeInput): Badge[] {
  const mk = (
    key: string,
    label: string,
    icon: string,
    description: string,
    value: number,
    threshold: number,
  ): Badge => ({
    key,
    label,
    icon,
    description,
    earned: value >= threshold,
    progress: Math.max(0, Math.min(1, value / threshold)),
  });

  return [
    mk("first-find", "First Find", "🐾", "Spot your first dog", input.totalSightings, 1),
    mk("ten-breeds", "Breed Hunter", "📒", "Collect 10 different breeds", input.uniqueBreeds, 10),
    mk("twentyfive-breeds", "Breed Master", "🏅", "Collect 25 different breeds", input.uniqueBreeds, 25),
    mk("fifty-breeds", "Dexologist", "🎓", "Collect 50 different breeds", input.uniqueBreeds, 50),
    mk("first-legendary", "Legend Hunter", "✨", "Spot a legendary breed", input.legendaryCount, 1),
    mk("first-share", "Town Crier", "🚀", "Share your first sighting", input.sharedCount, 1),
    mk("five-places", "Wayfinder", "🗺️", "Map 5 different places", input.placesCount, 5),
    mk("week-streak", "On a Roll", "🔥", "Keep a 7-day spotting streak", input.currentStreak, 7),
  ];
}
