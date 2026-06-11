"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  toko: createCustomIcon("#ef4444"),    // red-500
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
}

interface Location {
  lat: number;
  lng: number;
}

interface MapAreaProps {
  userLocation: Location;
  markers: MarkerData[];
  onMarkerClick?: (id: string) => void;
  activeShopId?: string | null;
}

export default function MapArea({
  userLocation,
  markers,
  onMarkerClick,
  activeShopId,
}: MapAreaProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

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
  const userMarkerRef = useRef<L.Marker | null>(null);
  
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => map.removeLayer(marker));
    markersRef.current = {};

    // Add markers
    markers.forEach((item) => {
      const icon = ICONS[item.type] || ICONS.default;
      const marker = L.marker([item.lat, item.lng], { icon })
        .addTo(map)
        .bindPopup(item.title);
      
      markersRef.current[item.id] = marker;

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(item.id));
      }
    });
  }, [markers, onMarkerClick]);

  // Update view when userLocation changes after mount
  useEffect(() => {
    if (mapInstanceRef.current && !activeShopId) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation.lat, userLocation.lng, activeShopId]);

  // Handle activeShopId changes
  useEffect(() => {
    if (mapInstanceRef.current && activeShopId) {
      const activeMarker = markers.find((m) => m.id === activeShopId);
      if (activeMarker) {
        // Fly to the active shop
        mapInstanceRef.current.flyTo([activeMarker.lat, activeMarker.lng], 16, {
          animate: true,
          duration: 0.8,
        });

        // Open popup for the active shop
        const marker = markersRef.current[activeShopId];
        if (marker) {
          marker.openPopup();
        }
      }
    }
  }, [activeShopId, markers]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    />
  );
}
