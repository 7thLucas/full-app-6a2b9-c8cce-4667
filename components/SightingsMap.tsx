"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapSighting {
  _id: string;
  photoUrl: string;
  breedName: string;
  dogName?: string;
  location: { lat: number | null; lng: number | null; label: string | null };
}

interface Props {
  sightings: MapSighting[];
}

// Custom paw-pin marker built from an inline SVG (no external image assets,
// avoids Leaflet's broken default-icon-path issue under bundlers).
function pawIcon() {
  const html = `
    <div style="
      width:38px;height:38px;border-radius:50% 50% 50% 0;
      background:oklch(0.86 0.18 128);transform:rotate(-45deg);
      border:3px solid #F6F1E2;box-shadow:0 4px 10px rgba(40,30,10,0.35);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:18px;line-height:1;">🐾</span>
    </div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -36],
  });
}

export default function SightingsMap({ sightings }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render / refresh pins whenever sightings change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layer = L.layerGroup().addTo(map);
    const bounds: L.LatLngExpression[] = [];

    const pinned = sightings.filter(
      (s) => typeof s.location?.lat === "number" && typeof s.location?.lng === "number",
    );

    pinned.forEach((s) => {
      const lat = s.location.lat as number;
      const lng = s.location.lng as number;
      bounds.push([lat, lng]);

      const place = s.location.label || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
      const popupHtml = `
        <div style="width:170px;font-family:system-ui,sans-serif;">
          ${
            s.photoUrl
              ? `<img src="${s.photoUrl}" alt="${s.breedName}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />`
              : `<div style="width:100%;height:110px;display:flex;align-items:center;justify-content:center;font-size:40px;background:oklch(0.90 0.032 80);border-radius:8px;margin-bottom:6px;">🐶</div>`
          }
          <div style="font-weight:800;font-size:13px;color:oklch(0.24 0.02 60);">${s.breedName}</div>
          ${s.dogName ? `<div style="font-size:12px;color:oklch(0.44 0.02 62);">"${s.dogName}"</div>` : ""}
          <div style="font-size:11px;color:oklch(0.60 0.018 64);margin:2px 0 6px;">📍 ${place}</div>
          <button data-sighting-id="${s._id}" style="
            width:100%;background:oklch(0.86 0.18 128);color:oklch(0.34 0.09 132);border:none;border-radius:9999px;
            padding:7px 0;font-size:12px;font-weight:800;cursor:pointer;">
            View sighting
          </button>
        </div>`;

      L.marker([lat, lng], { icon: pawIcon() }).addTo(layer).bindPopup(popupHtml);
    });

    // Delegate clicks on the "View sighting" button inside popups.
    const onPopupOpen = (e: L.PopupEvent) => {
      const node = e.popup.getElement();
      const btn = node?.querySelector<HTMLButtonElement>("button[data-sighting-id]");
      if (btn) {
        btn.onclick = () => router.push(`/sighting/${btn.dataset.sightingId}`);
      }
    };
    map.on("popupopen", onPopupOpen);

    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 13 });
    }

    return () => {
      map.off("popupopen", onPopupOpen);
      layer.remove();
    };
  }, [sightings, router]);

  return <div ref={containerRef} className="w-full h-full" />;
}
