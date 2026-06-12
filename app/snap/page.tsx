"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { getCurrentCoords, reverseGeocode, type Coords } from "@/lib/geo";

type Step = "camera" | "preview" | "submitting" | "success";

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
  const [result, setResult] = useState<{ id: string; breedName: string; breedConfidence: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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

  // Auto location tagging (Instagram-style): request permission, get coords,
  // reverse-geocode to a readable place name, and pre-fill it as a suggestion
  // the user can accept or edit. Denial is handled gracefully (manual entry).
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
    // Pre-fill the editable field only if the user hasn't typed their own.
    setLocationLabel((prev) => (prev ? prev : label));
    setLocStatus("found");
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

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

      const res = await fetch("/api/dogedex/sightings", {
        method: "POST",
        body: form,
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.message || "Failed to submit");

      const data = json.data;
      setResult({
        id: data._id,
        breedName: data.breedName,
        breedConfidence: data.breedConfidence,
      });
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("preview");
    }
  }, [capturedBlob, notes, dogName, location, locationLabel]);

  const share = useCallback(async () => {
    if (!result) return;
    try {
      await fetch(`/api/dogedex/sightings/${result.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shared: true }),
      });
    } catch {
      // non-fatal
    }
    router.push("/");
  }, [result, router]);

  const switchCamera = useCallback(() => {
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
  }, []);

  return (
    <div className="min-h-screen bg-doge-dark text-white flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 bg-doge-dark z-40">
        <button onClick={() => router.push("/")} className="text-white/60 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">
          {step === "camera" && "Snap a Dog"}
          {step === "preview" && "Preview"}
          {step === "submitting" && "Identifying..."}
          {step === "success" && "Got it!"}
        </h1>
      </header>

      <div className="flex-1 flex flex-col pb-safe">
        {/* CAMERA STEP */}
        {step === "camera" && (
          <div className="flex flex-col flex-1">
            <div className="camera-container flex-1 relative bg-black" style={{ minHeight: 320 }}>
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-white/60 text-sm mb-4">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-doge-yellow text-doge-dark font-bold px-5 py-2 rounded-full text-sm"
                  >
                    Choose from Library
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="scan-line opacity-60" />
                  {/* Corners */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-doge-yellow rounded-tl" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-doge-yellow rounded-tr" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-doge-yellow rounded-bl" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-doge-yellow rounded-br" />
                  {/* Switch camera */}
                  <button
                    onClick={switchCamera}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center mr-10"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="p-6 flex items-center justify-center gap-6 bg-doge-dark">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-doge-card border border-white/20 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              <button
                onClick={snap}
                disabled={!!cameraError}
                className="w-20 h-20 rounded-full border-4 border-doge-yellow bg-white/10 flex items-center justify-center disabled:opacity-40 transition active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-doge-yellow" />
              </button>

              <div className="w-12 h-12" /> {/* Spacer */}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* PREVIEW STEP */}
        {step === "preview" && capturedUrl && (
          <div className="flex flex-col flex-1">
            <div className="relative flex-shrink-0" style={{ maxHeight: 320 }}>
              <img src={capturedUrl} alt="Captured" className="w-full object-cover" style={{ maxHeight: 320 }} />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-doge-dark/80" />
            </div>

            <div className="flex-1 p-4 space-y-4">
              {error && (
                <div className="bg-doge-accent/20 border border-doge-accent/40 rounded-lg p-3 text-sm text-doge-accent">
                  {error}
                </div>
              )}

              <div>
                <label className="text-white/60 text-xs font-medium uppercase tracking-wide">
                  Dog&apos;s Name (optional)
                </label>
                <input
                  type="text"
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  placeholder="Buddy, Max, Luna..."
                  className="mt-1 w-full bg-doge-card border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-doge-yellow/50"
                />
              </div>

              <div>
                <label className="text-white/60 text-xs font-medium uppercase tracking-wide">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Spotted near the park, super friendly..."
                  rows={2}
                  className="mt-1 w-full bg-doge-card border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-doge-yellow/50 resize-none"
                />
              </div>

              <div>
                <label className="text-white/60 text-xs font-medium uppercase tracking-wide">
                  Location
                </label>

                {/* Status / suggested location chip (Instagram-style) */}
                {locStatus === "locating" && (
                  <p className="text-white/40 text-xs mt-1 flex items-center gap-2">
                    <span className="w-3 h-3 border border-doge-yellow/40 border-t-doge-yellow rounded-full animate-spin inline-block" />
                    Finding your location...
                  </p>
                )}
                {locStatus === "found" && suggestedLabel && (
                  <button
                    type="button"
                    onClick={() => setLocationLabel(suggestedLabel)}
                    className="mt-1 inline-flex items-center gap-1.5 bg-doge-yellow/15 border border-doge-yellow/40 text-doge-yellow rounded-full px-3 py-1 text-xs font-medium"
                  >
                    📍 {suggestedLabel}
                    {locationLabel !== suggestedLabel && (
                      <span className="text-doge-yellow/60">· tap to use</span>
                    )}
                  </button>
                )}
                {locStatus === "denied" && (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-white/40 text-xs">
                      Location off — add one manually.
                    </p>
                    <button
                      type="button"
                      onClick={requestLocation}
                      className="text-doge-yellow text-xs font-medium"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="Central Park, Main Street..."
                  className="mt-2 w-full bg-doge-card border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-doge-yellow/50"
                />
                {location && (
                  <p className="text-white/30 text-xs mt-1">
                    GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={retake}
                  className="flex-1 py-3 rounded-full border border-white/20 text-white/70 text-sm font-semibold"
                >
                  Retake
                </button>
                <button
                  onClick={submit}
                  className="flex-1 py-3 rounded-full bg-doge-yellow text-doge-dark text-sm font-bold"
                >
                  Identify + Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMITTING STEP */}
        {step === "submitting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            {capturedUrl && (
              <div className="relative w-40 h-40 rounded-2xl overflow-hidden">
                <img src={capturedUrl} alt="Processing" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-doge-dark/60 flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-doge-yellow/30 border-t-doge-yellow rounded-full animate-spin" />
                </div>
              </div>
            )}
            <div className="text-center">
              <p className="text-doge-yellow font-bold text-lg">AI is sniffing...</p>
              <p className="text-white/50 text-sm mt-1">Identifying the breed</p>
            </div>
            <div className="flex gap-2">
              {["🐕", "🔍", "🧬"].map((emoji, i) => (
                <div
                  key={i}
                  className="text-xl animate-bounce"
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUCCESS STEP */}
        {step === "success" && result && (
          <div className="flex-1 flex flex-col items-center p-6 text-center">
            <div className="pop-in">
              <div className="text-6xl mb-4">🎉</div>
            </div>
            <h2 className="text-2xl font-bold text-doge-yellow mb-1">New Entry!</h2>
            <p className="text-white/50 text-sm mb-6">Added to your Dogedex</p>

            {capturedUrl && (
              <div className="w-48 h-48 rounded-2xl overflow-hidden mb-6 border-2 border-doge-yellow/40">
                <img src={capturedUrl} alt={result.breedName} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="breed-badge text-base px-4 py-2 mb-3">{result.breedName}</div>

            <div className="w-full max-w-xs mb-2">
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{
                    width: `${Math.round(result.breedConfidence * 100)}%`,
                    background:
                      result.breedConfidence > 0.7
                        ? "#00D084"
                        : result.breedConfidence > 0.4
                        ? "#F5C518"
                        : "#E94560",
                  }}
                />
              </div>
              <p className="text-white/40 text-xs mt-1">
                {Math.round(result.breedConfidence * 100)}% confidence
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
              <button
                onClick={share}
                className="w-full py-3 rounded-full bg-doge-yellow text-doge-dark font-bold text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                Share + Save
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-full border border-white/20 text-white/70 text-sm font-semibold"
              >
                Save to Dogedex
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
                className="text-white/40 text-sm"
              >
                Snap another
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav active="snap" />
    </div>
  );
}
