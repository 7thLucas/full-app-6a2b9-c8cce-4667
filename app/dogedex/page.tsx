"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { CANONICAL_BREEDS } from "@/lib/breeds";

interface CollectionBreed {
  breedName: string;
  canonicalBreed: string | null;
  count: number;
  photoUrl: string;
  sightingId: string;
  tier: "common" | "uncommon" | "rare" | "legendary";
  rarityLabel: string;
  foil: boolean;
}

const TIER_DOT: Record<CollectionBreed["tier"], string> = {
  common: "var(--color-ink-3)",
  uncommon: "var(--color-sky)",
  rare: "var(--color-coral)",
  legendary: "var(--color-gold)",
};

export default function DogedexPage() {
  const [breeds, setBreeds] = useState<CollectionBreed[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollection = useCallback(async () => {
    try {
      const res = await fetch("/api/dogedex/collection");
      const json = await res.json();
      if (json.success) setBreeds(json.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  // Index spotted breeds by their canonical name, plus collect non-canonical "extras".
  const { spottedByCanonical, extras } = useMemo(() => {
    const map = new Map<string, CollectionBreed>();
    const ex: CollectionBreed[] = [];
    for (const b of breeds) {
      if (b.canonicalBreed) map.set(b.canonicalBreed, b);
      else ex.push(b);
    }
    return { spottedByCanonical: map, extras: ex };
  }, [breeds]);

  const foundCanonical = spottedByCanonical.size;
  const total = CANONICAL_BREEDS.length;
  const pct = Math.round((foundCanonical / total) * 100);

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b-2 border-line">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-ink grid place-items-center text-lg">📒</span>
              <div>
                <h1 className="display text-xl text-ink leading-none">Your Dogedex</h1>
                <p className="kick mt-1">The trophy case</p>
              </div>
            </div>
            <span className="display text-lg text-ink">
              {foundCanonical}
              <span className="text-ink-3 text-sm"> / {total}</span>
            </span>
          </div>
          {/* Completeness bar */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="confidence-bar flex-1">
              <div className="confidence-fill" style={{ width: `${pct}%`, background: "var(--color-ball)" }} />
            </div>
            <span className="text-ink-3 text-[0.7rem] font-bold">{pct}%</span>
          </div>
        </div>
      </header>

      <main className="pb-safe p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-line border-t-ball rounded-full animate-spin" />
            <p className="text-ink-3 text-sm">Opening your Dogedex…</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              {CANONICAL_BREEDS.map((breed, i) => {
                const hit = spottedByCanonical.get(breed);
                const no = String(i + 1).padStart(3, "0");
                if (hit) {
                  return (
                    <Link key={breed} href={`/sighting/${hit.sightingId}`}>
                      <div
                        className={`relative aspect-square rounded-xl overflow-hidden sticker rise-in ${hit.foil ? "foil" : "bg-paper"}`}
                        style={{ animationDelay: `${Math.min(i, 12) * 25}ms`, padding: hit.foil ? "2.5px" : "0" }}
                      >
                        <div className="relative w-full h-full rounded-[0.6rem] overflow-hidden">
                          {hit.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={hit.photoUrl} alt={breed} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-3xl bg-paper-3">🐕</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-paper" style={{ background: TIER_DOT[hit.tier] }} />
                          <div className="absolute bottom-0 left-0 right-0 p-1.5">
                            <p className="text-paper font-bold text-[0.62rem] leading-tight truncate">{breed}</p>
                            <p className="text-ball text-[0.6rem] font-semibold">×{hit.count}</p>
                          </div>
                          <span className="absolute top-1 left-1.5 text-paper/70 text-[0.55rem] font-mono">#{no}</span>
                        </div>
                      </div>
                    </Link>
                  );
                }
                // Silhouette placeholder — the "gotta find this one" pull.
                return (
                  <div
                    key={breed}
                    className="relative aspect-square rounded-xl bg-paper-2 border-2 border-dashed border-line grid place-items-center"
                    title={breed}
                  >
                    <span className="text-3xl opacity-25 grayscale">🐾</span>
                    <span className="absolute top-1 left-1.5 text-ink-3/60 text-[0.55rem] font-mono">#{no}</span>
                    <span className="absolute bottom-1 left-1.5 right-1.5 text-ink-3 text-[0.56rem] font-semibold text-center truncate">
                      {breed}
                    </span>
                  </div>
                );
              })}
            </div>

            {extras.length > 0 && (
              <section className="mt-7">
                <p className="kick mb-2.5">Off the master list · extras</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {extras.map((b) => (
                    <Link key={b.breedName} href={`/sighting/${b.sightingId}`}>
                      <div className={`relative aspect-square rounded-xl overflow-hidden sticker ${b.foil ? "foil" : "bg-paper"}`} style={{ padding: b.foil ? "2.5px" : "0" }}>
                        <div className="relative w-full h-full rounded-[0.6rem] overflow-hidden">
                          {b.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.photoUrl} alt={b.breedName} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-3xl bg-paper-3">🐕</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-1.5">
                            <p className="text-paper font-bold text-[0.62rem] leading-tight truncate">{b.breedName}</p>
                            <p className="text-ball text-[0.6rem] font-semibold">×{b.count}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav active="dogedex" />
    </div>
  );
}
