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
      background:#F5C518;transform:rotate(-45deg);
      border:2px solid #1A1A2E;box-shadow:0 2px 6px rgba(0,0,0,0.5);
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
              : `<div style="width:100%;height:110px;display:flex;align-items:center;justify-content:center;font-size:40px;background:#16213E;border-radius:8px;margin-bottom:6px;">🐶</div>`
          }
          <div style="font-weight:700;font-size:13px;color:#1A1A2E;">${s.breedName}</div>
          ${s.dogName ? `<div style="font-size:12px;color:#444;">"${s.dogName}"</div>` : ""}
          <div style="font-size:11px;color:#666;margin:2px 0 6px;">📍 ${place}</div>
          <button data-sighting-id="${s._id}" style="
            width:100%;background:#F5C518;color:#1A1A2E;border:none;border-radius:9999px;
            padding:6px 0;font-size:12px;font-weight:700;cursor:pointer;">
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
