"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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

export default function HomePage() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"feed" | "dex">("feed");

  const fetchSightings = useCallback(async () => {
    try {
      const res = await fetch("/api/dogedex/sightings");
      const json = await res.json();
      if (json.success) setSightings(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSightings();
  }, [fetchSightings]);

  // Group by breed for Dex view
  const breedMap = sightings.reduce<Record<string, Sighting[]>>((acc, s) => {
    if (!acc[s.breedName]) acc[s.breedName] = [];
    acc[s.breedName].push(s);
    return acc;
  }, {});

  const uniqueBreeds = Object.entries(breedMap).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="min-h-screen bg-doge-dark text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-doge-dark/95 backdrop-blur border-b border-doge-yellow/20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <div>
              <h1 className="text-lg font-bold text-doge-yellow leading-none">Dogedex</h1>
              <p className="text-xs text-white/40">Gotta pat &apos;em all</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-doge-card rounded-full p-1">
            <button
              onClick={() => setView("feed")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                view === "feed"
                  ? "bg-doge-yellow text-doge-dark"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setView("dex")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                view === "dex"
                  ? "bg-doge-yellow text-doge-dark"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Dogedex
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div className="px-4 pb-2 flex gap-4 text-xs text-white/50">
            <span>
              <span className="text-doge-yellow font-bold">{sightings.length}</span> sightings
            </span>
            <span>
              <span className="text-doge-yellow font-bold">{uniqueBreeds.length}</span> breeds
            </span>
          </div>
        )}
      </header>

      <main className="pb-safe">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-2 border-doge-yellow/30 border-t-doge-yellow rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Loading your Dogedex...</p>
          </div>
        ) : sightings.length === 0 ? (
          <EmptyState />
        ) : view === "feed" ? (
          <FeedView sightings={sightings} />
        ) : (
          <DexView uniqueBreeds={uniqueBreeds} />
        )}
      </main>

      <BottomNav active="home" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="text-6xl mb-4 animate-bounce-gentle">🐶</div>
      <h2 className="text-xl font-bold mb-2">Your Dogedex is empty!</h2>
      <p className="text-white/50 text-sm mb-6">
        Start snapping dogs to fill your collection. Every breed you spot gets added here.
      </p>
      <Link
        href="/snap"
        className="bg-doge-yellow text-doge-dark font-bold px-6 py-3 rounded-full text-sm"
      >
        Snap your first dog
      </Link>
    </div>
  );
}

function FeedView({ sightings }: { sightings: Sighting[] }) {
  return (
    <div className="p-4 space-y-3">
      {sightings.map((s, i) => (
        <Link key={s._id} href={`/sighting/${s._id}`}>
          <div
            className="dex-entry overflow-hidden"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex gap-3 p-3">
              {/* Photo */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-doge-card flex-shrink-0 relative">
                {s.photoUrl ? (
                  <img
                    src={s.photoUrl}
                    alt={s.breedName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🐶
                  </div>
                )}
                {s.shared && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-doge-green rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="breed-badge truncate max-w-[140px]">{s.breedName}</span>
                  <span className="text-white/30 text-xs flex-shrink-0">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {s.dogName && (
                  <p className="text-white font-medium text-sm truncate">&ldquo;{s.dogName}&rdquo;</p>
                )}

                {/* Confidence */}
                <div className="mt-2">
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${Math.round(s.breedConfidence * 100)}%`,
                        background:
                          s.breedConfidence > 0.7
                            ? "#00D084"
                            : s.breedConfidence > 0.4
                            ? "#F5C518"
                            : "#E94560",
                      }}
                    />
                  </div>
                  <p className="text-white/30 text-xs mt-0.5">
                    {Math.round(s.breedConfidence * 100)}% confident
                  </p>
                </div>

                {s.location?.label && (
                  <p className="text-white/40 text-xs mt-1 truncate">
                    📍 {s.location.label}
                  </p>
                )}
              </div>
            </div>

            {s.notes && (
              <div className="px-3 pb-3">
                <p className="text-white/50 text-xs italic truncate">&ldquo;{s.notes}&rdquo;</p>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function DexView({
  uniqueBreeds,
}: {
  uniqueBreeds: [string, Sighting[]][];
}) {
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {uniqueBreeds.map(([breed, sightings], i) => {
          const best = sightings[0];
          return (
            <Link key={breed} href={`/sighting/${best._id}`}>
              <div
                className="dex-entry overflow-hidden aspect-square relative"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {best.photoUrl ? (
                  <img
                    src={best.photoUrl}
                    alt={breed}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl bg-doge-card">
                    🐕
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white font-bold text-xs leading-tight truncate">{breed}</p>
                  <p className="text-doge-yellow text-xs">×{sightings.length}</p>
                </div>
                {/* Dex entry number */}
                <div className="absolute top-1.5 right-1.5 bg-black/50 rounded px-1 py-0.5">
                  <span className="text-white/60 text-xs font-mono">
                    #{String(i + 1).padStart(3, "0")}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
