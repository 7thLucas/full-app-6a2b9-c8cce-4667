"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";

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
}

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
      // silently fail
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
        setSighting(json.data);
        setEditing(false);
      }
    } catch {
      // silently fail
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
      if (json.success) setSighting(json.data);
    } catch {
      // silently fail
    }
  }, [id, sighting]);

  const deleteSighting = useCallback(async () => {
    if (!confirm("Delete this sighting?")) return;
    try {
      await fetch(`/api/dogedex/sightings/${id}`, { method: "DELETE" });
      router.push("/");
    } catch {
      // silently fail
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-doge-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-doge-yellow/30 border-t-doge-yellow rounded-full animate-spin" />
      </div>
    );
  }

  if (!sighting) {
    return (
      <div className="min-h-screen bg-doge-dark flex flex-col items-center justify-center text-center p-6">
        <div className="text-4xl mb-4">🐕</div>
        <p className="text-white/50">Sighting not found</p>
        <button onClick={() => router.push("/")} className="mt-4 text-doge-yellow text-sm">
          Back to Dogedex
        </button>
      </div>
    );
  }

  const confidence = Math.round(sighting.breedConfidence * 100);
  const confidenceColor =
    sighting.breedConfidence > 0.7
      ? "#00D084"
      : sighting.breedConfidence > 0.4
      ? "#F5C518"
      : "#E94560";

  return (
    <div className="min-h-screen bg-doge-dark text-white">
      {/* Hero photo */}
      <div className="relative" style={{ height: 340 }}>
        {sighting.photoUrl ? (
          <img
            src={sighting.photoUrl}
            alt={sighting.breedName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-doge-card flex items-center justify-center text-6xl">
            🐶
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-doge-dark" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={share}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              sighting.shared ? "bg-doge-green" : "bg-black/40"
            }`}
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-safe -mt-6 relative z-10">
        {/* Breed card */}
        <div className="dex-entry p-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            {editing ? (
              <input
                type="text"
                value={breedName}
                onChange={(e) => setBreedName(e.target.value)}
                className="bg-doge-dark border border-doge-yellow/40 rounded px-2 py-1 text-white font-bold text-lg w-full mr-2 focus:outline-none"
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{sighting.breedName}</h2>
            )}
            {sighting.shared && (
              <span className="text-xs text-doge-green flex-shrink-0 ml-2">Shared</span>
            )}
          </div>

          {/* Confidence */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/50">AI Confidence</span>
              <span style={{ color: confidenceColor }} className="font-bold">
                {confidence}%
              </span>
            </div>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{ width: `${confidence}%`, background: confidenceColor }}
              />
            </div>
          </div>

          {/* Alternatives */}
          {sighting.breedAlternatives.length > 0 && (
            <div>
              <p className="text-white/40 text-xs mb-2">Other possibilities:</p>
              <div className="space-y-1">
                {sighting.breedAlternatives.map((alt, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-white/60">{alt.breed}</span>
                    <span className="text-white/40">{Math.round(alt.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          {/* Dog name */}
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wide">Name</label>
            {editing ? (
              <input
                type="text"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                placeholder="Dog's name..."
                className="mt-1 w-full bg-doge-card border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-doge-yellow/50"
              />
            ) : (
              <p className="text-white text-sm mt-1">
                {sighting.dogName || <span className="text-white/30">Not recorded</span>}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wide">Notes</label>
            {editing ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
                className="mt-1 w-full bg-doge-card border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-doge-yellow/50 resize-none"
              />
            ) : (
              <p className="text-white text-sm mt-1">
                {sighting.notes || <span className="text-white/30">No notes</span>}
              </p>
            )}
          </div>

          {/* Location */}
          {(sighting.location?.label || sighting.location?.lat) && (
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wide">Location</label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm">📍</span>
                <div>
                  {sighting.location.label && (
                    <p className="text-white text-sm">{sighting.location.label}</p>
                  )}
                  {sighting.location.lat && (
                    <p className="text-white/40 text-xs">
                      {sighting.location.lat.toFixed(4)}, {sighting.location.lng?.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wide">Spotted on</label>
            <p className="text-white text-sm mt-1">
              {new Date(sighting.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Actions */}
        {editing && (
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-3 rounded-full border border-white/20 text-white/70 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-3 rounded-full bg-doge-yellow text-doge-dark font-bold text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}

        <button
          onClick={deleteSighting}
          className="w-full text-doge-accent text-sm text-center py-2 mb-4"
        >
          Delete sighting
        </button>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
