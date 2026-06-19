"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

interface Badge {
  key: string;
  label: string;
  icon: string;
  description: string;
  earned: boolean;
  progress: number;
}

interface Stats {
  totalSightings: number;
  uniqueBreeds: number;
  canonicalTotal: number;
  legendaryCount: number;
  placesCount: number;
  sharedCount: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
}

export default function YouPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dogedex/stats");
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b-2 border-line">
        <div className="px-4 py-3 flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-sky grid place-items-center text-lg">👤</span>
          <div>
            <h1 className="display text-xl text-ink leading-none">You</h1>
            <p className="kick mt-1">Streaks · badges · stats</p>
          </div>
        </div>
      </header>

      <main className="pb-safe p-4 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-line border-t-ball rounded-full animate-spin" />
            <p className="text-ink-3 text-sm">Tallying your finds…</p>
          </div>
        ) : !stats ? (
          <p className="text-ink-3 text-sm text-center py-20">Could not load your stats.</p>
        ) : (
          <>
            {/* Streak hero */}
            <section className="rounded-2xl bg-ink p-5 flex items-center gap-4">
              <div className="text-5xl">🔥</div>
              <div className="flex-1">
                <p className="kick text-ink-3">Current streak</p>
                <p className="display text-4xl text-gold leading-none mt-1">
                  {stats.currentStreak}
                  <span className="text-paper text-lg"> {stats.currentStreak === 1 ? "day" : "days"}</span>
                </p>
                <p className="text-ink-3 text-xs mt-1.5">Longest ever: {stats.longestStreak} days</p>
              </div>
            </section>

            {/* Stat tiles */}
            <section className="grid grid-cols-2 gap-3">
              <Stat value={`${stats.uniqueBreeds}/${stats.canonicalTotal}`} label="Breeds collected" accent="var(--color-ball)" />
              <Stat value={stats.totalSightings} label="Dogs spotted" accent="var(--color-sky)" />
              <Stat value={stats.legendaryCount} label="Legendaries" accent="var(--color-gold)" />
              <Stat value={stats.placesCount} label="Places mapped" accent="var(--color-coral)" />
            </section>

            {/* Badges */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <p className="kick">Badges</p>
                <span className="text-ink-3 text-xs font-bold">
                  {stats.badges.filter((b) => b.earned).length} / {stats.badges.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stats.badges.map((b) => (
                  <div
                    key={b.key}
                    className={`rounded-2xl p-3.5 border-2 ${
                      b.earned ? "bg-paper border-ink sticker" : "bg-paper-2 border-line border-dashed"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`text-2xl ${b.earned ? "" : "grayscale opacity-40"}`}>{b.icon}</span>
                      <div className="min-w-0">
                        <p className={`display text-sm leading-tight ${b.earned ? "text-ink" : "text-ink-3"}`}>{b.label}</p>
                        <p className="text-ink-3 text-[0.68rem] leading-tight mt-0.5 truncate">{b.description}</p>
                      </div>
                    </div>
                    {!b.earned && (
                      <div className="confidence-bar mt-2.5">
                        <div className="confidence-fill" style={{ width: `${Math.round(b.progress * 100)}%`, background: "var(--color-ink-3)" }} />
                      </div>
                    )}
                    {b.earned && (
                      <p className="text-ball text-[0.62rem] font-bold mt-2">Earned ✓</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Settings */}
            <section>
              <p className="kick mb-2.5">Settings</p>
              <div className="rounded-2xl bg-paper border-2 border-line overflow-hidden">
                <SettingRow icon="📍" label="Location tagging" value="Asked at capture" note="Managed in your browser/OS permissions" />
                <SettingRow icon="🌍" label="Sharing" value="Public" note="Shared sightings appear on the global feed & map" border />
                <SettingRow icon="🐾" label="Master breed list" value={`${stats.canonicalTotal} breeds`} note="V1 canonical set for collection completeness" border />
              </div>
              <p className="text-ink-3 text-[0.7rem] text-center mt-4">
                Dogedex V1 · Gotta pat &apos;em all
              </p>
            </section>

            <Link
              href="/snap"
              className="block text-center bg-ball text-ballink font-bold py-3 rounded-full text-sm pressable display"
            >
              Snap another dog
            </Link>
          </>
        )}
      </main>

      <BottomNav active="you" />
    </div>
  );
}

function Stat({ value, label, accent }: { value: string | number; label: string; accent: string }) {
  return (
    <div className="rounded-2xl bg-paper border-2 border-line p-4">
      <p className="display text-3xl text-ink leading-none" style={{ color: accent }}>{value}</p>
      <p className="text-ink-2 text-xs font-semibold mt-1.5">{label}</p>
    </div>
  );
}

function SettingRow({ icon, label, value, note, border }: { icon: string; label: string; value: string; note: string; border?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${border ? "border-t-2 border-line" : ""}`}>
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-ink text-sm font-bold">{label}</p>
        <p className="text-ink-3 text-[0.68rem] truncate">{note}</p>
      </div>
      <span className="text-ink-2 text-xs font-semibold flex-shrink-0">{value}</span>
    </div>
  );
}
