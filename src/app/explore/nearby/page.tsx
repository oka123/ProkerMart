"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, PanInfo } from "framer-motion";
import {
  Search,
  ArrowLeft,
  Navigation,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { NearbyShopCard } from "@/components/NearbyShopCard";
import type { MarkerData } from "@/components/MapArea";
import React from "react";

// Dynamic import for MapArea to prevent SSR issues with Leaflet
const MapArea = dynamic(() => import("@/components/MapArea"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-500">
      Memuat Peta...
    </div>
  ),
});

// Mock fallback user location (Jimbaran area) in case geolocation fails
const FALLBACK_USER_LOCATION = {
  lat: -8.795,
  lng: 115.176,
};

interface Shop {
  id: string;
  name: string;
  categories: string;
  rating: number;
  reviewCount: number | string;
  distanceKm: number;
  travelTimeMin: number;
  imageUrl: string;
  promoTag?: string;
  lat: number;
  lng: number;
  tokoId?: string;
  tokoName?: string;
  tokoCoords?: { lat: number; lng: number } | null;
  panitiaList?: Array<{ id: string; name: string; lat: number; lng: number }>;
}
export default function NearbyShopsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [sheetState, setSheetState] = useState<
    "collapsed" | "half" | "expanded"
  >("half");

  const [userLocation, setUserLocation] = useState(FALLBACK_USER_LOCATION);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedDetails = React.useMemo(() => {
    if (!activeMarkerId) return null;

    if (activeMarkerId.startsWith("toko-")) {
      const shopId = activeMarkerId.substring(5);
      const shop = shops.find((s) => s.id === shopId);
      if (shop) {
        return {
          shop,
          type: "toko",
          buttonText: "Lihat Organisasi",
          linkUrl: `/organizations/${shop.tokoId}`,
          displayName: shop.tokoName,
        };
      }
    } else if (activeMarkerId.startsWith("panitia-")) {
      const panitiaId = activeMarkerId.substring(8);
      const shop = shops.find((s) =>
        s.panitiaList?.some((p) => p.id === panitiaId),
      );
      const panitia = shop?.panitiaList?.find((p) => p.id === panitiaId);
      if (shop) {
        return {
          shop,
          type: "panitia",
          buttonText: "Lihat Proker",
          linkUrl: `/organizations/${shop.tokoId}/${shop.id}`,
          panitiaName: panitia?.name,
        };
      }
    } else {
      const shop = shops.find((s) => s.id === activeMarkerId);
      if (shop) {
        return {
          shop,
          type: "subtoko",
          buttonText: "Lihat Proker",
          linkUrl: `/organizations/${shop.tokoId}/${shop.id}`,
        };
      }
    }
    return null;
  }, [activeMarkerId, shops]);

  const mapMarkers = React.useMemo(() => {
    const arr: MarkerData[] = [];
    arr.push({
      id: "user-loc",
      title: "Lokasi Anda",
      lat: userLocation.lat,
      lng: userLocation.lng,
      type: "pembeli",
    });

    shops.forEach((shop) => {
      arr.push({
        id: shop.id,
        title: `Proker: ${shop.name}`,
        lat: shop.lat,
        lng: shop.lng,
        type: "subtoko",
        linkUrl: `/organizations/${shop.tokoId}/${shop.id}`,
      });

      if (shop.tokoCoords) {
        arr.push({
          id: `toko-${shop.id}`,
          title: `Organisasi: ${shop.tokoName || "Toko Utama"}`,
          lat: shop.tokoCoords.lat,
          lng: shop.tokoCoords.lng,
          type: "toko",
          linkUrl: `/organizations/${shop.tokoId}`,
        });
      }

      if (shop.panitiaList) {
        shop.panitiaList.forEach((p) => {
          arr.push({
            id: `panitia-${p.id}`,
            title: `Panitia: ${p.name}`,
            lat: p.lat,
            lng: p.lng,
            type: "panitia",
            organizationName: shop.tokoName || "Toko Utama",
            prokerName: shop.name,
            linkUrl: `/organizations/${shop.tokoId}/${shop.id}`,
          });
        });
      }
    });

    return arr;
  }, [shops, userLocation]);

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(value), 500);
  };

  // Fetch nearby shops from API
  const fetchNearbyShops = useCallback(
    async (lat: number, lng: number, search: string) => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const params = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          radius: "10", // 10km radius
        });
        if (search) params.set("search", search);

        const res = await fetch(`/api/nearby?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal mengambil data toko");

        const data = await res.json();
        setShops(data.shops || []);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Terjadi kesalahan.");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Request user location
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolokasi tidak didukung oleh browser Anda.");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(newLocation);
        setIsGettingLocation(false);
        // Map will re-render and API will be re-fetched via useEffect
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  // Re-fetch when location or search changes
  useEffect(() => {
    fetchNearbyShops(userLocation.lat, userLocation.lng, debouncedSearch);
  }, [userLocation, debouncedSearch, fetchNearbyShops]);

  // Initial location request (optional, can just use fallback initially)
  // useEffect(() => {
  //   handleGetLocation();
  // }, [handleGetLocation]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y < -30) {
      // Dragged UP
      if (sheetState === "collapsed") {
        setSheetState("half");
      } else if (sheetState === "half") {
        setSheetState("expanded");
      }
    } else if (info.offset.y > 30) {
      // Dragged DOWN
      if (sheetState === "expanded") {
        setSheetState("half");
      } else if (sheetState === "half") {
        setSheetState("collapsed");
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-primary-600 text-white pt-4 px-4 relative">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/explore"
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari penjual, toko atau proker di sekitarmu"
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/70 focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 transition-all"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Link
            href="/cart"
            className="p-2 relative hover:bg-white/10 rounded-full transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-primary-600 rounded-full"></span>
          </Link>
        </div>
      </div>

      {/* Main Content Area (Map + List) */}
      <div className="flex-1 relative flex flex-col lg:flex-row-reverse z-10 bg-white rounded-t-3xl overflow-hidden shadow-xl lg:shadow-none lg:mt-0 lg:rounded-none lg:bg-transparent">
        {/* Map Container */}
        <motion.div
          initial={false}
          animate={{
            height:
              sheetState === "expanded"
                ? "0vh"
                : sheetState === "half"
                  ? "45vh"
                  : "80vh",
          }}
          transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
          className="lg:h-full! lg:w-1/2 relative bg-slate-200 overflow-hidden"
        >
          <MapArea
            userLocation={userLocation}
            markers={mapMarkers}
            onMarkerClick={(id) => {
              setActiveMarkerId(id);
            }}
            activeMarkerId={activeMarkerId}
          />

          {/* Location Indicator Over Map */}
          <div className="absolute bottom-4 right-4 z-400 flex flex-col gap-2 items-end">
            <button
              onClick={handleGetLocation}
              disabled={isGettingLocation}
              title="Dapatkan lokasi saat ini"
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              {isGettingLocation ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Navigation className="w-6 h-6 fill-current" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Bottom Sheet / Sidebar List */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden lg:w-1/2 lg:rounded-tr-3xl relative z-20">
          {/* Drag Handle for Mobile */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (sheetState === "collapsed") {
                setSheetState("half");
              } else if (sheetState === "half") {
                setSheetState("expanded");
              } else {
                setSheetState("collapsed");
              }
            }}
            className="w-full flex justify-center pt-4 pb-3 lg:hidden cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
          </motion.div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto overscroll-none px-4 py-2">
            {isLoading && shops.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : errorMsg ? (
              <div className="text-center py-10 text-red-500">
                <p>{errorMsg}</p>
                <button
                  onClick={() =>
                    fetchNearbyShops(
                      userLocation.lat,
                      userLocation.lng,
                      debouncedSearch,
                    )
                  }
                  className="mt-2 text-primary-600 font-medium"
                >
                  Coba Lagi
                </button>
              </div>
            ) : selectedDetails ? (
              <div className="flex flex-col gap-4 pt-2">
                {selectedDetails.type === "panitia" && (
                  <div className="bg-violet-50 border border-violet-100 text-violet-800 px-4 py-2.5 rounded-xl text-xs font-semibold">
                    Anggota Panitia:{" "}
                    <span className="underline">
                      {selectedDetails.panitiaName}
                    </span>
                  </div>
                )}

                <NearbyShopCard
                  {...selectedDetails.shop}
                  displayName={selectedDetails.displayName}
                />

                <div className="flex flex-col gap-2 mt-2">
                  <Link href={selectedDetails.linkUrl} className="w-full">
                    <button className="w-full bg-primary-600 text-white font-medium py-3 px-4 rounded-xl shadow-sm flex justify-center items-center hover:bg-primary-700 transition-colors gap-2">
                      {selectedDetails.buttonText}{" "}
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </Link>
                  <button
                    onClick={() => setActiveMarkerId(null)}
                    className="w-full bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl flex justify-center items-center hover:bg-slate-300 transition-colors"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            ) : shops.length > 0 ? (
              <div className="flex flex-col gap-3">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="cursor-pointer"
                    onClick={() => setActiveMarkerId(shop.id)}
                  >
                    <NearbyShopCard {...shop} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>Tidak ada penjual di sekitarmu.</p>
                <p className="text-sm mt-1">
                  Coba geser peta atau ubah kata kunci pencarian.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
