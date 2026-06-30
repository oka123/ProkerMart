"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const deliveryIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: "hue-rotate-[200deg]",
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface TrackingMapProps {
  lat: number;
  lng: number;
  updatedAt: string | null;
  mapId?: string;
}

export default function TrackingMap({ lat, lng, updatedAt, mapId = "tracking-map" }: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  // Clean up any existing Leaflet instance on the container before mounting
  useEffect(() => {
    const el = containerRef.current;
    if (el && (el as any)._leaflet_id) {
      delete (el as any)._leaflet_id;
    }
  }, []);

  return (
    <div ref={containerRef} style={{ height: "100%", width: "100%" }}>
      <MapContainer
        key={mapId}
        center={[lat, lng]}
        zoom={16}
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={deliveryIcon}>
          <Popup>
            Posisi panitia pengantar
            {timeLabel && <><br /><span className="text-xs text-slate-500">Update: {timeLabel}</span></>}
          </Popup>
        </Marker>
        <RecenterMap lat={lat} lng={lng} />
      </MapContainer>
    </div>
  );
}
