"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import type { MapSighting } from "@/components/SightingsMap";

const SightingsMap = dynamic(() => import("@/components/SightingsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-10 h-10 border-2 border-line border-t-ball rounded-full animate-spin" />
      <p className="text-ink-3 text-sm">Loading map…</p>
    </div>
  ),
});

export default function MapPage() {
  const [sightings, setSightings] = useState<MapSighting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShared = useCallback(async () => {
    try {
      // Only shared sightings appear on the global map (same rule as the feed).
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
    fetchShared();
  }, [fetchShared]);

  const pinned = sightings.filter(
    (s) => typeof s.location?.lat === "number" && typeof s.location?.lng === "number",
  );

  return (
    <div className="min-h-screen text-ink flex flex-col">
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b-2 border-line">
        <div className="px-4 py-3 flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-sky grid place-items-center text-lg">🗺️</span>
          <div>
            <h1 className="display text-xl text-ink leading-none">Map</h1>
            <p className="kick mt-1">Shared sightings worldwide</p>
          </div>
          <span className="ml-auto text-xs font-bold text-ink-2">{pinned.length} pinned</span>
        </div>
      </header>

      <main className="flex-1 relative" style={{ minHeight: 0 }}>
        <div className="absolute inset-0" style={{ paddingBottom: 84 }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 border-2 border-line border-t-ball rounded-full animate-spin" />
              <p className="text-ink-3 text-sm">Loading shared sightings…</p>
            </div>
          ) : pinned.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-3">
              <div className="text-5xl">📍</div>
              <h2 className="display text-xl text-ink">No pins yet</h2>
              <p className="text-ink-2 text-sm max-w-xs leading-relaxed">
                Share a sighting with a tagged location and it lands here for every dog lover to see.
              </p>
              <Link href="/snap" className="mt-2 bg-ball text-ballink font-bold px-5 py-2.5 rounded-full text-sm pressable display">
                Snap a dog
              </Link>
            </div>
          ) : (
            <SightingsMap sightings={sightings} />
          )}
        </div>
      </main>

      <BottomNav active="map" />
    </div>
  );
}
