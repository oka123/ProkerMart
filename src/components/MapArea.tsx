"use client";

import { useEffect, useRef } from "react";
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

const ICONS = {
  pembeli: createCustomIcon("#3b82f6"), // blue-500
  toko: createCustomIcon("#f97316"), // orange-500
  subtoko: createCustomIcon("#10b981"), // emerald-500
  panitia: createCustomIcon("#8b5cf6"), // violet-500
  default: createCustomIcon("#64748b"), // slate-500
};

export type MarkerType = "pembeli" | "toko" | "subtoko" | "panitia" | "default";

export interface MarkerData {
  id: string;
  title: string;
  lat: number;
  lng: number;
  type: MarkerType;
  linkUrl?: string;
  organizationName?: string;
  prokerName?: string;
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const router = useRouter();

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map manually to have full control over lifecycle
    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

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
      } else if (item.type === "toko") {
        popupContent += `
          <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 6px;">${item.title}</div>
          ${item.linkUrl ? `<button class="map-popup-btn" data-url="${item.linkUrl}" style="background-color: #f97316; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; width: 100%; text-align: center; margin-top: 4px;">Lihat Organisasi &rarr;</button>` : ""}
        `;
      } else if (item.type === "subtoko") {
        popupContent += `
          <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 6px;">${item.title}</div>
          ${item.linkUrl ? `<button class="map-popup-btn" data-url="${item.linkUrl}" style="background-color: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; width: 100%; text-align: center; margin-top: 4px;">Lihat Proker &rarr;</button>` : ""}
        `;
      } else if (item.type === "panitia") {
        popupContent += `
          <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 2px;">${item.title}</div>
          ${item.organizationName ? `<div style="font-size: 11px; color: #64748b; margin-bottom: 2px;"><b>Organisasi:</b> ${item.organizationName}</div>` : ""}
          ${item.prokerName ? `<div style="font-size: 11px; color: #64748b; margin-bottom: 6px;"><b>Proker:</b> ${item.prokerName}</div>` : ""}
          ${item.linkUrl ? `<button class="map-popup-btn" data-url="${item.linkUrl}" style="background-color: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; width: 100%; text-align: center; margin-top: 4px;">Lihat Proker &rarr;</button>` : ""}
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
