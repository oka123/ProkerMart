import { Star, Clock, MapPin } from "lucide-react";

interface NearbyShopCardProps {
  id: string;
  name: string;
  categories: string;
  rating: number;
  reviewCount: string | number;
  distanceKm: number;
  travelTimeMin: number;
  imageUrl: string;
  promoTag?: string;
  displayName?: string;
}

export function NearbyShopCard({
  name,
  categories,
  rating,
  reviewCount,
  distanceKm,
  travelTimeMin,
  promoTag,
  displayName,
}: NearbyShopCardProps) {
  return (
    <div className="flex bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm p-3 gap-4 mb-4">
      {/* Image Container */}
      <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-200">
        {/* Placeholder if no image optimization is set up properly */}
        <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500">
          <span className="text-xs">Image</span>
        </div>
        {promoTag && (
          <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg">
            {promoTag}
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
          {displayName || name}
        </h3>
        <p className="text-xs text-slate-500 mb-2">{categories}</p>

        <div className="flex items-center text-xs text-slate-600 gap-2 mb-2">
          {Number(reviewCount) > 0 ? (
            <div className="flex items-center text-amber-500 font-medium">
              <Star className="w-3.5 h-3.5 fill-current mr-1" />
              {Number(rating).toFixed(1)}{" "}
              <span className="text-slate-400 font-normal ml-1">
                ({reviewCount})
              </span>
            </div>
          ) : (
            <div className="text-slate-400 italic text-[10px]">
              Belum ada ulasan
            </div>
          )}
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {distanceKm} m
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {travelTimeMin} mnt
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          {/* <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded">
            Diskon 100%
          </span> */}
          {/* <span className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 px-2 py-1 rounded">
            Gratis Ongkir
          </span> */}
        </div>
      </div>
    </div>
  );
}
