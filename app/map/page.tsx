"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import type { MapSighting } from "@/components/SightingsMap";

// Leaflet touches `window`/DOM, so load the map purely client-side.
const SightingsMap = dynamic(() => import("@/components/SightingsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-10 h-10 border-2 border-doge-yellow/30 border-t-doge-yellow rounded-full animate-spin" />
      <p className="text-white/40 text-sm">Loading map...</p>
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
      // silently fail
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
    <div className="min-h-screen bg-doge-dark text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-doge-dark/95 backdrop-blur border-b border-doge-yellow/20">
        <div className="px-4 py-3 flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          <div>
            <h1 className="text-lg font-bold text-doge-yellow leading-none">Map</h1>
            <p className="text-xs text-white/40">Recent shared sightings worldwide</p>
          </div>
          <span className="ml-auto text-xs text-white/50">
            <span className="text-doge-yellow font-bold">{pinned.length}</span> pinned
          </span>
        </div>
      </header>

      {/* Map area fills the space above the bottom nav */}
      <main className="flex-1 relative" style={{ minHeight: 0 }}>
        <div className="absolute inset-0" style={{ paddingBottom: 80 }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 border-2 border-doge-yellow/30 border-t-doge-yellow rounded-full animate-spin" />
              <p className="text-white/40 text-sm">Loading shared sightings...</p>
            </div>
          ) : pinned.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
              <div className="text-5xl">📍</div>
              <h2 className="text-lg font-bold">No pins yet</h2>
              <p className="text-white/50 text-sm">
                Share a sighting with a tagged location and it will appear here for
                every dog lover to see.
              </p>
              <Link
                href="/snap"
                className="mt-2 bg-doge-yellow text-doge-dark font-bold px-5 py-2.5 rounded-full text-sm"
              >
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
