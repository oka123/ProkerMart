"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, WifiOff } from "lucide-react";

interface DeliveryTrackerProps {
  orderId: string;
  memberId: string;
  supabase: any;
}

export default function DeliveryTracker({ orderId, memberId, supabase }: DeliveryTrackerProps) {
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const updateLocation = async (lat: number, lng: number) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 10000) return; // throttle 10s
    lastUpdateRef.current = now;

    await supabase
      .from("pesanan")
      .update({
        lat_pengantar: lat,
        lng_pengantar: lng,
        lokasi_updated_at: new Date().toISOString(),
        pengantar_id: memberId,
      })
      .eq("id_pesanan", orderId);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Browser tidak support geolocation");
      return;
    }

    setTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        updateLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setError(err.message);
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, memberId]);

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        <span>GPS error: {error}</span>
      </div>
    );
  }

  if (!tracking) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-700">
      <Navigation className="w-3.5 h-3.5 shrink-0 animate-pulse" />
      <span>Lokasi kamu sedang dibagikan ke pembeli secara real-time.</span>
    </div>
  );
}
