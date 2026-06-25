"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Location {
  lat: number;
  lng: number;
}

interface LocationPickerMapProps {
  initialLocation: Location;
  onChange: (loc: Location) => void;
}

export default function LocationPickerMap({
  initialLocation,
  onChange,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [initLat] = useState(initialLocation.lat);
  const [initLng] = useState(initialLocation.lng);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLng],
      zoom: 16,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      attribution: "Google Maps",
    }).addTo(map);

    const marker = L.marker([initLat, initLng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;

    // Handle marker drag
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onChangeRef.current({ lat: pos.lat, lng: pos.lng });
    });

    // Handle map click
    map.on("click", (e: L.LeafletMouseEvent) => {
      const pos = e.latlng;
      marker.setLatLng(pos);
      onChangeRef.current({ lat: pos.lat, lng: pos.lng });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [initLat, initLng]);

  // Sync marker and map when initialLocation changes significantly (like from GPS button)
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      // Only flyTo and setLatLng if the new location is different from the marker's current position
      // This prevents resetting the map while the user is actively dragging
      if (
        Math.abs(currentPos.lat - initialLocation.lat) > 0.0001 ||
        Math.abs(currentPos.lng - initialLocation.lng) > 0.0001
      ) {
        markerRef.current.setLatLng([initialLocation.lat, initialLocation.lng]);
        mapInstanceRef.current.flyTo(
          [initialLocation.lat, initialLocation.lng],
          16,
          { animate: true },
        );
      }
    }
  }, [initialLocation.lat, initialLocation.lng]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      className="rounded-md border border-slate-200"
    />
  );
}
