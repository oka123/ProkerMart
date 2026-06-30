"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="background-color:${color};width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

const createUserIcon = (color: string) => {
  return L.divIcon({
    className: "custom-leaflet-marker-user",
    html: `<div style="background-color:${color};width:24px;height:24px;border-radius:12px;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="background-color:white;width:8px;height:8px;border-radius:4px;"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const ICONS = {
  pembeli: createUserIcon("#3b82f6"), // blue-500
  subtoko: createCustomIcon("#10b981"), // emerald-500
  default: createCustomIcon("#64748b"), // slate-500
};

export type MarkerType = "pembeli" | "subtoko" | "default";

export interface MarkerData {
  id: string;
  title: string;
  lat: number;
  lng: number;
  type: MarkerType;
  linkUrl?: string;
}

interface Location {
  lat: number;
  lng: number;
}

interface MapAreaProps {
  userLocation: Location;
  markers: MarkerData[];
  onMarkerClick?: (id: string) => void;
  activeMarkerId?: string | null;
}

export default function MapArea({
  userLocation,
  markers,
  onMarkerClick,
  activeMarkerId,
}: MapAreaProps) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [initLat] = useState(userLocation.lat);
  const [initLng] = useState(userLocation.lng);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map manually to have full control over lifecycle
    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLng],
      zoom: 16,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Google Maps tile layer
    L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}").addTo(
      map,
    );

    // We will handle user location and shop markers in a separate useEffect
    // to support dynamic updates.

    // CRITICAL: Call map.remove() on cleanup — this properly releases the
    // container so HMR remounts never hit "Map container is being reused".
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
    };
  }, [initLat, initLng]); // Run once on mount only

  // Update markers when shops or userLocation change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) =>
      map.removeLayer(marker),
    );
    markersRef.current = {};

    // Add markers
    markers.forEach((item) => {
      const icon = ICONS[item.type] || ICONS.default;

      // Build popup content
      let popupContent = `<div style="font-family: 'Outfit', 'Inter', sans-serif; padding: 4px; min-width: 140px;">`;
      if (item.type === "pembeli") {
        popupContent += `<strong style="color: #1e293b; font-size: 14px;">${item.title}</strong>`;
      } else if (item.type === "subtoko") {
        popupContent += `
          <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 6px;">${item.title}</div>
          ${item.linkUrl ? `<button class="map-popup-btn" data-url="${item.linkUrl}" style="background-color: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; width: 100%; text-align: center; margin-top: 4px;">Lihat Proker &rarr;</button>` : ""}
        `;
      } else {
        popupContent += `<div style="color: #1e293b; font-size: 13px;">${item.title}</div>`;
      }
      popupContent += `</div>`;

      const marker = L.marker([item.lat, item.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent);

      // Bind routing event to button when popup opens
      marker.on("popupopen", (e) => {
        const popupNode = e.popup.getElement();
        if (popupNode) {
          const btn = popupNode.querySelector(".map-popup-btn");
          if (btn) {
            btn.addEventListener("click", () => {
              const url = btn.getAttribute("data-url");
              if (url) {
                router.push(url);
              }
            });
          }
        }
      });

      markersRef.current[item.id] = marker;

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(item.id));
      }
    });
  }, [markers, onMarkerClick, router]);

  // Update view when userLocation changes after mount
  useEffect(() => {
    if (mapInstanceRef.current && !activeMarkerId) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation.lat, userLocation.lng, activeMarkerId]);

  // Handle activeMarkerId changes
  useEffect(() => {
    if (mapInstanceRef.current && activeMarkerId) {
      const activeMarker = markers.find((m) => m.id === activeMarkerId);
      if (activeMarker) {
        // Fly to the active shop
        mapInstanceRef.current.flyTo([activeMarker.lat, activeMarker.lng], 16, {
          animate: true,
          duration: 0.8,
        });

        // Open popup for the active shop
        const marker = markersRef.current[activeMarkerId];
        if (marker) {
          marker.openPopup();
        }
      }
    }
  }, [activeMarkerId, markers]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    />
  );
}
