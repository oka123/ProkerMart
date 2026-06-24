"use client";

import { useState } from "react";
import { Star, Filter, MessageSquare } from "lucide-react";
import type { ReviewWithUser } from "@/lib/supabase/queries/review";

interface ReviewListProps {
  initialReviews: ReviewWithUser[];
}

export function ReviewList({ initialReviews }: ReviewListProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null);
  
  const reviews = initialReviews;

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Determine reviews to show
  const filteredReviews = filterRating 
    ? reviews.filter(r => r.rating === filterRating)
    : reviews;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
      {/* Grid: Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Average Score */}
        <div className="flex flex-col items-center justify-center text-center pb-6 md:pb-0 border-b md:border-b-0 md:border-r border-slate-150">
          <span className="text-5xl font-extrabold text-blue-600 tracking-tight mb-2">
            {avgRating.toFixed(1)}
          </span>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.round(avgRating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            {reviews.length} Ulasan
          </span>
        </div>

        {/* Rating Bars */}
        <div className="md:col-span-2 flex flex-col justify-center gap-2 md:pl-4">
          {[5, 4, 3, 2, 1].map((ratingVal) => {
            const count = reviews.filter((r) => r.rating === ratingVal).length;
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={ratingVal} className="flex items-center gap-3 text-sm">
                <span className="w-3 font-semibold text-slate-700">{ratingVal}</span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-500 font-medium">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Section */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mr-2">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          <button
            onClick={() => setFilterRating(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterRating === null
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            Semua
          </button>
          {[5, 4, 3, 2, 1].map((ratingVal) => {
            const count = reviews.filter((r) => r.rating === ratingVal).length;
            if (count === 0) return null;
            return (
              <button
                key={`filter-${ratingVal}`}
                onClick={() => setFilterRating(ratingVal)}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterRating === ratingVal
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    filterRating === ratingVal
                      ? "text-white fill-white"
                      : "text-amber-400 fill-amber-400"
                  }`}
                />
                {ratingVal}
              </button>
            );
          })}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => {
            const initials = review.pengguna?.nama
              ? review.pengguna.nama
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "?";

            return (
              <div
                key={review.id_ulasan}
                className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-xs flex gap-4"
              >
                {/* Initials Avatar */}
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {initials}
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <h4 className="font-bold text-slate-800 text-sm truncate">
                      {review.pengguna?.nama || "Pembeli ProkerMart"}
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(review.tgl_ulasan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment Text */}
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {review.komentar || "Tidak ada komentar tertulis."}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              {filterRating ? `Tidak ada ulasan dengan rating ${filterRating}.` : "Belum ada ulasan untuk produk ini."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
