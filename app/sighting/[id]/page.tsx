"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface Rarity {
  tier: "common" | "uncommon" | "rare" | "legendary";
  label: string;
  foil: boolean;
}

interface Sighting {
  _id: string;
  photoUrl: string;
  breedName: string;
  breedConfidence: number;
  breedAlternatives: Array<{ breed: string; confidence: number }>;
  dogName: string;
  notes: string;
  shared: boolean;
  location: { lat: number | null; lng: number | null; label: string | null };
  createdAt: string;
  rarity?: Rarity;
}

const TIER_COLOR: Record<Rarity["tier"], string> = {
  common: "var(--color-ink-3)",
  uncommon: "var(--color-sky)",
  rare: "var(--color-coral)",
  legendary: "var(--color-gold)",
};

export default function SightingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [sighting, setSighting] = useState<Sighting | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [dogName, setDogName] = useState("");
  const [breedName, setBreedName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSighting = useCallback(async () => {
    try {
      const res = await fetch(`/api/dogedex/sightings/${id}`);
      const json = await res.json();
      if (json.success) {
        setSighting(json.data);
        setNotes(json.data.notes || "");
        setDogName(json.data.dogName || "");
        setBreedName(json.data.breedName || "");
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSighting();
  }, [fetchSighting]);

  const save = useCallback(async () => {
    if (!sighting) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dogedex/sightings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, dogName, breedName }),
      });
      const json = await res.json();
      if (json.success) {
        setSighting((prev) => (prev ? { ...prev, notes, dogName, breedName } : prev));
        setEditing(false);
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }, [id, sighting, notes, dogName, breedName]);

  const share = useCallback(async () => {
    if (!sighting) return;
    try {
      const res = await fetch(`/api/dogedex/sightings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shared: !sighting.shared }),
      });
      const json = await res.json();
      if (json.success) setSighting((prev) => (prev ? { ...prev, shared: !prev.shared } : prev));
    } catch {
      /* silent */
    }
  }, [id, sighting]);

  const deleteSighting = useCallback(async () => {
    if (!confirm("Delete this sighting?")) return;
    try {
      await fetch(`/api/dogedex/sightings/${id}`, { method: "DELETE" });
      router.push("/dogedex");
    } catch {
      /* silent */
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-line border-t-ball rounded-full animate-spin" />
      </div>
    );
  }

  if (!sighting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <div className="text-4xl mb-4">🐕</div>
        <p className="text-ink-3">Sighting not found</p>
        <button onClick={() => router.push("/")} className="mt-4 text-sky text-sm font-bold">Back to feed</button>
      </div>
    );
  }

  const confidence = Math.round(sighting.breedConfidence * 100);
  const confColor = sighting.breedConfidence > 0.7 ? "var(--color-ball)" : sighting.breedConfidence > 0.4 ? "var(--color-gold)" : "var(--color-coral)";
  const rarity = sighting.rarity;

  return (
    <div className="min-h-screen text-ink">
      {/* Hero */}
      <div className={`relative ${rarity?.foil ? "foil" : ""}`} style={{ height: 320, padding: rarity?.foil ? "5px" : "0" }}>
        <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: rarity?.foil ? "0.5rem" : "0" }}>
          {sighting.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sighting.photoUrl} alt={sighting.breedName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-paper-3 grid place-items-center text-6xl">🐶</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-paper" />
        </div>

        <button onClick={() => router.back()} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-paper/90 sticker grid place-items-center pressable">
          <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={share} className={`w-10 h-10 rounded-full grid place-items-center sticker pressable ${sighting.shared ? "bg-ball" : "bg-paper/90"}`}>
            <svg className={`w-5 h-5 ${sighting.shared ? "text-ballink" : "text-ink"}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
          <button onClick={() => setEditing(!editing)} className="w-10 h-10 rounded-full bg-paper/90 sticker grid place-items-center pressable">
            <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 pb-safe -mt-4 relative z-10">
        {/* Breed card */}
        <div className="dex-entry p-4 mb-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            {editing ? (
              <input type="text" value={breedName} onChange={(e) => setBreedName(e.target.value)} className="bg-paper border-2 border-ball rounded-lg px-2 py-1 text-ink font-bold text-lg w-full mr-2 outline-none" />
            ) : (
              <h2 className="display text-2xl text-ink">{sighting.breedName}</h2>
            )}
            {rarity && (
              <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: TIER_COLOR[rarity.tier], border: `2px solid ${TIER_COLOR[rarity.tier]}` }}>
                {rarity.foil ? "✨ " : ""}{rarity.label}
              </span>
            )}
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-ink-3 font-semibold">AI confidence</span>
              <span style={{ color: confColor }} className="font-bold">{confidence}%</span>
            </div>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${confidence}%`, background: confColor }} />
            </div>
          </div>

          {sighting.breedAlternatives.length > 0 && (
            <div className="border-t-2 border-line pt-3">
              <p className="kick mb-2">Other possibilities</p>
              <div className="space-y-1.5">
                {sighting.breedAlternatives.map((alt, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-ink-2 font-medium">{alt.breed}</span>
                    <span className="text-ink-3">{Math.round(alt.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4 mb-4">
          <Detail label="Name">
            {editing ? (
              <input type="text" value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="Dog's name…" className="fg-input2" />
            ) : (
              <p className="text-ink text-sm">{sighting.dogName || <span className="text-ink-3">Not recorded</span>}</p>
            )}
          </Detail>

          <Detail label="Notes">
            {editing ? (
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes…" rows={3} className="fg-input2 resize-none" />
            ) : (
              <p className="text-ink text-sm">{sighting.notes || <span className="text-ink-3">No notes</span>}</p>
            )}
          </Detail>

          {(sighting.location?.label || sighting.location?.lat) && (
            <Detail label="Location">
              <div className="flex items-center gap-2">
                <span className="text-sm">📍</span>
                <div>
                  {sighting.location.label && <p className="text-ink text-sm font-medium">{sighting.location.label}</p>}
                  {sighting.location.lat != null && (
                    <p className="text-ink-3 text-xs">{sighting.location.lat.toFixed(4)}, {sighting.location.lng?.toFixed(4)}</p>
                  )}
                </div>
              </div>
            </Detail>
          )}

          <Detail label="Spotted on">
            <p className="text-ink text-sm">
              {new Date(sighting.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </Detail>
        </div>

        {editing && (
          <div className="flex gap-3 mb-4">
            <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-full border-2 border-line text-ink-2 text-sm font-bold pressable">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-full bg-ball text-ballink font-bold text-sm disabled:opacity-50 pressable display">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}

        <button onClick={deleteSighting} className="w-full text-coral text-sm font-semibold text-center py-2 mb-4">Delete sighting</button>
      </div>

      <style jsx>{`
        :global(.fg-input2) {
          width: 100%;
          background: var(--color-paper);
          border: 2px solid var(--color-line);
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          color: var(--color-ink);
          font-size: 0.875rem;
          outline: none;
        }
        :global(.fg-input2:focus) {
          border-color: var(--color-ball);
        }
        :global(.fg-input2::placeholder) {
          color: var(--color-ink-3);
        }
      `}</style>

      <BottomNav active="feed" />
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="kick">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
