"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { getCurrentCoords, reverseGeocode, type Coords } from "@/lib/geo";

type Step = "camera" | "preview" | "submitting" | "success";

interface Rarity {
  tier: "common" | "uncommon" | "rare" | "legendary";
  label: string;
  foil: boolean;
}

const TIER_COLOR: Record<Rarity["tier"], string> = {
  common: "var(--color-ink-3)",
  uncommon: "var(--color-sky)",
  rare: "var(--color-coral)",
  legendary: "var(--color-gold)",
};

export default function SnapPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("camera");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [dogName, setDogName] = useState("");
  const [location, setLocation] = useState<Coords | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [locStatus, setLocStatus] = useState<"idle" | "locating" | "found" | "denied">("idle");
  const [suggestedLabel, setSuggestedLabel] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; breedName: string; breedConfidence: number; rarity?: Rarity } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraError(null);
    } catch {
      setCameraError("Camera access denied. You can still upload a photo.");
    }
  }, [facingMode]);

  useEffect(() => {
    if (step === "camera") startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [step, startCamera]);

  // Auto location tagging (Instagram-style): request permission, reverse-geocode
  // to a readable place name, pre-fill as an editable suggestion. Denial is fine.
  const requestLocation = useCallback(async () => {
    setLocStatus("locating");
    const coords = await getCurrentCoords();
    if (!coords) {
      setLocStatus("denied");
      return;
    }
    setLocation(coords);
    const label = await reverseGeocode(coords);
    setSuggestedLabel(label);
    setLocationLabel((prev) => (prev ? prev : label));
    setLocStatus("found");
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const haptic = (ms = 12) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  };

  const snap = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        haptic(15);
        setCapturedBlob(blob);
        setCapturedUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setStep("preview");
      },
      "image/jpeg",
      0.9,
    );
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    setCapturedUrl(URL.createObjectURL(file));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStep("preview");
  }, []);

  const retake = useCallback(() => {
    setCapturedBlob(null);
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setStep("camera");
  }, [capturedUrl]);

  const submit = useCallback(async () => {
    if (!capturedBlob) return;
    setStep("submitting");
    setError(null);
    try {
      const form = new FormData();
      form.append("photo", capturedBlob, "dog.jpg");
      if (notes) form.append("notes", notes);
      if (dogName) form.append("dogName", dogName);
      if (location) {
        form.append("lat", String(location.lat));
        form.append("lng", String(location.lng));
      }
      if (locationLabel) form.append("locationLabel", locationLabel);

      const res = await fetch("/api/dogedex/sightings", { method: "POST", body: form });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to submit");

      const data = json.data;
      haptic(20);
      setResult({ id: data._id, breedName: data.breedName, breedConfidence: data.breedConfidence, rarity: data.rarity });
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("preview");
    }
  }, [capturedBlob, notes, dogName, location, locationLabel]);

  const share = useCallback(async () => {
    if (!result) return;
    haptic(18);
    try {
      await fetch(`/api/dogedex/sightings/${result.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shared: true }),
      });
    } catch {
      /* non-fatal */
    }
    router.push("/");
  }, [result, router]);

  const switchCamera = useCallback(() => {
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
  }, []);

  const confColor = (c: number) => (c > 0.7 ? "var(--color-ball)" : c > 0.4 ? "var(--color-gold)" : "var(--color-coral)");

  return (
    <div className="min-h-screen text-ink flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 bg-paper z-40 border-b-2 border-line">
        <button onClick={() => router.push("/")} className="text-ink-2 pressable">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="display text-lg text-ink">
          {step === "camera" && "Snap a dog"}
          {step === "preview" && "Add the details"}
          {step === "submitting" && "Identifying…"}
          {step === "success" && "Got it!"}
        </h1>
      </header>

      <div className="flex-1 flex flex-col pb-safe">
        {/* CAMERA */}
        {step === "camera" && (
          <div className="flex flex-col flex-1">
            <div className="camera-container flex-1 relative" style={{ minHeight: 340 }}>
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-paper-3">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-ink-2 text-sm mb-4 max-w-xs">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-ball text-ballink font-bold px-5 py-2.5 rounded-full text-sm pressable display"
                  >
                    Choose from library
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="scan-line" />
                  <div className="absolute top-4 left-4 w-9 h-9 border-t-[3px] border-l-[3px] border-ball rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-9 h-9 border-t-[3px] border-r-[3px] border-ball rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-9 h-9 border-b-[3px] border-l-[3px] border-ball rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-9 h-9 border-b-[3px] border-r-[3px] border-ball rounded-br-lg" />
                  <button onClick={switchCamera} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-ink/40 grid place-items-center pressable">
                    <svg className="w-5 h-5 text-paper" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <div className="p-6 flex items-center justify-center gap-8 bg-paper">
              <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-paper-2 border-2 border-line grid place-items-center pressable">
                <svg className="w-5 h-5 text-ink-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button onClick={snap} disabled={!!cameraError} className="w-20 h-20 rounded-full border-[5px] border-ball bg-paper grid place-items-center disabled:opacity-40 transition active:scale-95">
                <div className="w-14 h-14 rounded-full bg-ball" />
              </button>
              <div className="w-12 h-12" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {/* PREVIEW / review screen */}
        {step === "preview" && capturedUrl && (
          <div className="flex flex-col flex-1">
            <div className="relative flex-shrink-0" style={{ maxHeight: 300 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedUrl} alt="Captured" className="w-full object-cover" style={{ maxHeight: 300 }} />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-paper" />
            </div>

            <div className="flex-1 p-4 space-y-4">
              {error && (
                <div className="bg-coral/10 border-2 border-coral/40 rounded-xl p-3 text-sm text-coral font-medium">{error}</div>
              )}

              <Field label="Dog's name (optional)">
                <input type="text" value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="Buddy, Max, Luna…" className="fg-input" />
              </Field>

              <Field label="Notes (optional)">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Spotted near the park, super friendly…" rows={2} className="fg-input resize-none" />
              </Field>

              <Field label="Location">
                {locStatus === "locating" && (
                  <p className="text-ink-3 text-xs mt-1 flex items-center gap-2">
                    <span className="w-3 h-3 border border-line border-t-ball rounded-full animate-spin inline-block" />
                    Finding your location…
                  </p>
                )}
                {locStatus === "found" && suggestedLabel && (
                  <button type="button" onClick={() => setLocationLabel(suggestedLabel)} className="mt-1 inline-flex items-center gap-1.5 bg-sky/12 border-2 border-sky/40 text-sky rounded-full px-3 py-1 text-xs font-semibold pressable">
                    📍 {suggestedLabel}
                    {locationLabel !== suggestedLabel && <span className="opacity-60">· tap to use</span>}
                  </button>
                )}
                {locStatus === "denied" && (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-ink-3 text-xs">Location off — add one manually.</p>
                    <button type="button" onClick={requestLocation} className="text-sky text-xs font-bold">Retry</button>
                  </div>
                )}
                <input type="text" value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="Central Park, Main Street…" className="fg-input mt-2" />
                {location && <p className="text-ink-3 text-xs mt-1">GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>}
              </Field>

              <div className="flex gap-3 pt-1">
                <button onClick={retake} className="flex-1 py-3 rounded-full border-2 border-line text-ink-2 text-sm font-bold pressable">Retake</button>
                <button onClick={submit} className="flex-1 py-3 rounded-full bg-ball text-ballink text-sm font-bold pressable display">Identify + add</button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMITTING */}
        {step === "submitting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            {capturedUrl && (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden sticker">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedUrl} alt="Processing" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-ink/40 grid place-items-center">
                  <div className="w-10 h-10 border-2 border-paper/40 border-t-ball rounded-full animate-spin" />
                </div>
              </div>
            )}
            <div className="text-center">
              <p className="display text-ink text-xl">AI is sniffing…</p>
              <p className="text-ink-3 text-sm mt-1">Rolling for a breed</p>
            </div>
            <div className="flex gap-2">
              {["🐕", "🔍", "🧬"].map((e, i) => (
                <div key={i} className="text-xl animate-bounce" style={{ animationDelay: `${i * 200}ms` }}>{e}</div>
              ))}
            </div>
          </div>
        )}

        {/* SUCCESS — stamp-to-dex payoff */}
        {step === "success" && result && (
          <div className="flex-1 flex flex-col items-center p-6 text-center">
            <div className="stamp-pop mb-4">
              <span className="stamp text-ball text-xs px-4 py-1.5 inline-block">New entry!</span>
            </div>

            {capturedUrl && (
              <div className={`capture-card w-52 h-52 rounded-2xl overflow-hidden mb-5 sticker ${result.rarity?.foil ? "foil" : ""}`} style={{ padding: result.rarity?.foil ? "4px" : "0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedUrl} alt={result.breedName} className="w-full h-full object-cover rounded-[0.8rem]" />
              </div>
            )}

            <h2 className="display text-2xl text-ink">{result.breedName}</h2>

            {result.rarity && (
              <span
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
                style={{ color: TIER_COLOR[result.rarity.tier], border: `2px solid ${TIER_COLOR[result.rarity.tier]}` }}
              >
                {result.rarity.foil ? "✨ " : ""}{result.rarity.label}
              </span>
            )}

            <div className="w-full max-w-xs mt-4 mb-1">
              <div className="confidence-bar">
                <div className="confidence-fill" style={{ width: `${Math.round(result.breedConfidence * 100)}%`, background: confColor(result.breedConfidence) }} />
              </div>
              <p className="text-ink-3 text-xs mt-1.5">{Math.round(result.breedConfidence * 100)}% confidence · tap into the entry to correct it</p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs mt-5">
              <button onClick={share} className="w-full py-3 rounded-full bg-ball text-ballink font-bold text-sm flex items-center justify-center gap-2 pressable display">
                🚀 Share + save
              </button>
              <button onClick={() => router.push("/dogedex")} className="w-full py-3 rounded-full border-2 border-line text-ink-2 text-sm font-bold pressable">
                Keep private in Dogedex
              </button>
              <button
                onClick={() => {
                  setCapturedBlob(null);
                  setCapturedUrl(null);
                  setNotes("");
                  setDogName("");
                  setLocationLabel(suggestedLabel || "");
                  setResult(null);
                  setStep("camera");
                }}
                className="text-ink-3 text-sm font-semibold"
              >
                Snap another
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.fg-input) {
          width: 100%;
          background: var(--color-paper);
          border: 2px solid var(--color-line);
          border-radius: 0.75rem;
          padding: 0.55rem 0.8rem;
          color: var(--color-ink);
          font-size: 0.875rem;
          outline: none;
        }
        :global(.fg-input:focus) {
          border-color: var(--color-ball);
        }
        :global(.fg-input::placeholder) {
          color: var(--color-ink-3);
        }
      `}</style>

      <BottomNav active="snap" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="kick">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
