"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

interface Sighting {
  _id: string;
  photoUrl: string;
  breedName: string;
  breedConfidence: number;
  dogName: string;
  notes: string;
  shared: boolean;
  location: { lat: number | null; lng: number | null; label: string | null };
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function confColor(c: number): string {
  if (c > 0.7) return "var(--color-ball)";
  if (c > 0.4) return "var(--color-gold)";
  return "var(--color-coral)";
}

export default function FeedPage() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      // The Feed is the social heartbeat: only SHARED sightings appear.
      const res = await fetch("/api/dogedex/sightings?shared=true");
      const json = await res.json();
      if (json.success) setSightings(json.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div className="min-h-screen text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b-2 border-line">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-ball grid place-items-center text-lg">🐕</span>
            <div>
              <h1 className="display text-xl text-ink leading-none">Dogedex</h1>
              <p className="kick mt-1">Feed · the social heartbeat</p>
            </div>
          </div>
          <span className="text-xs font-bold text-ink-2">
            {sightings.length} shared
          </span>
        </div>
      </header>

      <main className="pb-safe">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-line border-t-ball rounded-full animate-spin" />
            <p className="text-ink-3 text-sm">Loading the feed…</p>
          </div>
        ) : sightings.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div className="p-4 space-y-3.5">
            {sightings.map((s, i) => (
              <Link key={s._id} href={`/sighting/${s._id}`}>
                <article
                  className="dex-entry overflow-hidden rise-in"
                  style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                >
                  {/* Photo */}
                  <div className="relative aspect-[5/3] bg-paper-3">
                    {s.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photoUrl} alt={s.breedName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-5xl">🐶</div>
                    )}
                    <span className="absolute top-2.5 left-2.5 breed-badge sticker">{s.breedName}</span>
                    <span className="absolute top-2.5 right-2.5 stamp text-coral bg-paper/90 text-[0.6rem] px-2 py-1 rotate-[-4deg]">
                      Shared ✓
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="display text-base text-ink truncate">
                        {s.dogName ? `“${s.dogName}”` : s.breedName}
                      </p>
                      <span className="text-ink-3 text-xs flex-shrink-0">{timeAgo(s.createdAt)}</span>
                    </div>

                    {s.location?.label && (
                      <p className="text-sky text-xs font-semibold mt-1 truncate">📍 {s.location.label}</p>
                    )}

                    {s.notes && (
                      <p className="text-ink-2 text-sm mt-2 leading-snug line-clamp-2">{s.notes}</p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <div className="confidence-bar flex-1">
                        <div
                          className="confidence-fill"
                          style={{ width: `${Math.round(s.breedConfidence * 100)}%`, background: confColor(s.breedConfidence) }}
                        />
                      </div>
                      <span className="text-ink-3 text-[0.7rem] font-semibold flex-shrink-0">
                        {Math.round(s.breedConfidence * 100)}% sure
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav active="feed" />
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="text-6xl mb-4">🐶</div>
      <h2 className="display text-2xl text-ink mb-2">The feed is quiet</h2>
      <p className="text-ink-2 text-sm mb-6 max-w-xs leading-relaxed">
        No shared sightings yet. Snap a dog and share it to start the stream for every dog lover.
      </p>
      <Link
        href="/snap"
        className="bg-ball text-ballink font-bold px-6 py-3 rounded-full text-sm pressable display"
      >
        Snap your first dog
      </Link>
    </div>
  );
}
